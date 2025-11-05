<?php

namespace App\Http\Controllers\User;

use App\Events\OrderCreated;
use App\Http\Controllers\Controller;
use App\DTOs\User\OrderDTO;
use App\Services\User\OrderService;
use App\Services\User\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Events\ProductStockUpdated;
use App\Models\Product;

class OrderController extends Controller
{
    public function __construct(
        private OrderService $orders,
        private ProductService $products
    ) {}

    /**
     * POST /api/v1/orders
     * Accepts a minimal payload to place an order from the storefront.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customerId' => ['nullable','integer','min:0'],
            'shippingAddress' => ['required','string','max:500'],
            'township' => ['nullable','string','max:255'],
            'city' => ['nullable','string','max:255'],
            'state' => ['nullable','string','max:255'],
            'zipCode' => ['nullable','string','max:50'],
            'totalPrice' => ['required','numeric'],
            'deliveryDate' => ['nullable'],
            'paymentType' => ['required','string','max:100'],
            'deliveryType' => ['nullable','string','max:100'],
            'sendEmail' => ['nullable','boolean'],
            'branchId' => ['nullable','integer'],
            'products' => ['required','array','min:1'],
            'products.*.id' => ['required','integer'],
            'products.*.quantity' => ['required','integer','min:1'],
        ]);

        // Prevent duplicate orders: check if user created an order with same total in last 5 seconds
        $userId = isset($validated['customerId']) ? (int) $validated['customerId'] : 0;
        $total = (float) $validated['totalPrice'];
        
        if ($this->orders->isDuplicateOrder($userId > 0 ? $userId : null, $total, (string) $validated['shippingAddress'], 5)) {
            return response()->json([
                'success' => false,
                'error' => 'Duplicate order detected. Please wait before creating another order.'
            ], 409);
        }

        // Get branch_id from request (accept both branchId and branch_id)
        $branchId = (int) ($validated['branchId'] ?? $request->input('branch_id', 0));
        $holdKey = (string) $request->input('holdKey', $request->input('hold_key', (string)($request->cookie('hold_key') ?? '')));

        // Build order items from product catalog with branch-specific prices
        $items = [];
        $subtotal = 0.0;
        foreach ($validated['products'] as $row) {
            $product = $this->products->getProductById((int)$row['id']);
            if (!$product) { continue; }
            
            $qty = (int) $row['quantity'];
            
            // Check stock availability at selected branch
            if ($branchId > 0) {
                $branchStock = $this->products->getBranchStock($product->id, $branchId);
                
                // Validate stock availability
                if (!$branchStock) {
                    return response()->json([
                        'success' => false,
                        'error' => "Product '{$product->name}' is out of stock at selected branch.",
                        'product_id' => $product->id,
                        'available_quantity' => 0,
                        'requested_quantity' => $qty
                    ], 422);
                }
                // Available for this order = total branch qty - other active holds (exclude this holdKey)
                $available = app(\App\Repositories\ProductRepository::class)
                    ->getAvailableBranchQuantity($product->id, $branchId, $holdKey ?: null);
                if ($available < $qty) {
                    return response()->json([
                        'success' => false,
                        'error' => "Product '{$product->name}' is out of stock or insufficient quantity at selected branch.",
                        'product_id' => $product->id,
                        'available_quantity' => $available,
                        'requested_quantity' => $qty
                    ], 422);
                }
                
                // Get branch-specific price
                $price = (float) ($product->sale_price ?? $product->price ?? 0);
                if ($branchStock->price_override !== null) {
                    $price = (float) $branchStock->price_override;
                }
            } else {
                // No branch selected, use regular price
                $price = (float) ($product->sale_price ?? $product->price ?? 0);
                // Enforce global stock availability when no branch is specified, subtracting other holds
                $available = app(\App\Repositories\ProductRepository::class)
                    ->getAvailableGlobalQuantity($product->id, $holdKey ?: null);
                if ($available < $qty) {
                    return response()->json([
                        'success' => false,
                        'error' => "Product '{$product->name}' has insufficient stock.",
                        'product_id' => $product->id,
                        'available_quantity' => $available,
                        'requested_quantity' => $qty
                    ], 422);
                }
            }
            
            $items[] = [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'quantity' => $qty,
                'price' => $price,
                'total' => $price * $qty,
            ];
            $subtotal += $price * $qty;
        }

        $shipping = 0.0; // simple flat shipping handled on FE; could compute by deliveryType
        $tax = 0.0; // can be extended
        $total = (float) $validated['totalPrice'];

        $orderNumber = 'ORD-' . now()->format('YmdHis') . '-' . random_int(100, 999);

        $dto = new OrderDTO(
            userId: $userId > 0 ? $userId : null,
            orderNumber: $orderNumber,
            status: 'pending',
            subtotal: $subtotal,
            tax: $tax,
            shipping: $shipping,
            total: $total,
            paymentMethod: (string) $validated['paymentType'],
            paymentStatus: 'pending',
            shippingAddress: (string) $validated['shippingAddress'],
            notes: isset($validated['deliveryType']) ? ('Delivery: ' . $validated['deliveryType']) : null,
            items: $items,
        );

        $order = $this->orders->createOrder($dto);

        // Broadcast order created event
        event(new OrderCreated($order));

        // Decrement stock after order creation
        if ($branchId > 0) {
            // Per-branch stock decrement + recompute total
            foreach ($items as $it) {
                $branchStock = $this->products->getBranchStock($it['product_id'], $branchId);
                if ($branchStock) {
                    $productModel = Product::find($it['product_id']);
                    $oldStock = $productModel ? (int)$productModel->stock : 0;
                    $newQty = max(0, (int)$branchStock->quantity - (int)$it['quantity']);
                    $this->products->updateBranchStock($it['product_id'], $branchId, $newQty);
                    if ($productModel) {
                        $fresh = $productModel->fresh();
                        event(new ProductStockUpdated($fresh, $oldStock));
                    }
                }
            }
        } else {
            // Global stock decrement
            foreach ($items as $it) {
                $productModel = Product::find($it['product_id']);
                if ($productModel) {
                    $oldStock = (int)$productModel->stock;
                    $newStock = max(0, $oldStock - (int)$it['quantity']);
                    $this->products->updateStock($it['product_id'], $newStock);
                    $fresh = $productModel->fresh();
                    event(new ProductStockUpdated($fresh, $oldStock));
                }
            }
        }

        // Consume holds for this checkout key, if provided
        if ($holdKey) {
            \App\Models\ProductStockHold::where('hold_key', $holdKey)->delete();
        }

        $createdAt = method_exists($order, 'getAttribute') && $order->getAttribute('created_at')
            ? (string) $order->getAttribute('created_at')
            : now()->toISOString();
        $deliveryType = (string) ($validated['deliveryType'] ?? 'STORE_PICKUP');
        $deliveryDate = is_numeric($validated['deliveryDate'] ?? null)
            ? date('c', (int) $validated['deliveryDate'] / 1000)
            : now()->addDays(7)->toISOString();

        $payload = [
            'orderNumber' => (string)($order->order_number ?? $orderNumber),
            'customerId' => (int)$validated['customerId'],
            'shippingAddress' => (string)$validated['shippingAddress'],
            'totalPrice' => (float)$dto->total,
            'deliveryDate' => $deliveryDate,
            'paymentType' => (string)$validated['paymentType'],
            'deliveryType' => $deliveryType,
            'orderDate' => $createdAt,
        ];

        return response()->json([
            'success' => true,
            'data' => $payload,
        ], 200);
    }

    /**
     * GET /api/v1/orders/mine?user_id=1
     * Returns the recent orders of a specific user.
     */
    public function mine(Request $request): JsonResponse
    {
        $userId = (int) $request->query('user_id', 0);
        if ($userId <= 0) {
            return response()->json(['error' => ['message' => 'user_id is required']], 422);
        }

        $orders = $this->orders->getUserOrders($userId);

        $data = $orders->map(function ($o) {
            return [
                'id' => $o->id,
                'orderNumber' => $o->order_number,
                'status' => $o->status,
                'total' => (float) $o->total,
                'createdAt' => (string) $o->created_at,
                'items' => $o->items->map(function ($it) {
                    $images = [];
                    if (isset($it->product) && isset($it->product->images)) {
                        // Product accessor normalizes to relative /storage paths
                        $images = is_array($it->product->images) ? $it->product->images : [];
                    }
                    return [
                        'product_id' => $it->product_id,
                        'product_name' => $it->product_name,
                        'quantity' => (int) $it->quantity,
                        'price' => (float) $it->price,
                        'total' => (float) $it->total,
                        'images' => $images,
                    ];
                }),
            ];
        });

        return response()->json(['data' => $data]);
    }
}
