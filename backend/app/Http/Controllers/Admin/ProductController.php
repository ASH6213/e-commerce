<?php

namespace App\Http\Controllers\Admin;

use App\DTOs\Admin\ProductDTO;
use App\Events\ProductCreated;
use App\Events\ProductDeleted;
use App\Events\ProductUpdated;
use App\Events\ProductStockUpdated;
use App\Http\Controllers\Controller;
use App\Services\Admin\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(
        protected ProductService $productService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = $request->get('per_page', 15);
        $products = $this->productService->getPaginatedProducts($perPage);

        return response()->json($products);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'slug' => 'sometimes|string|unique:products,slug',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'sale_price' => 'nullable|numeric|min:0',
            'stock' => 'sometimes|integer|min:0',
            'sku' => 'nullable|string|unique:products,sku',
            'images' => 'nullable|array',
            'images.*' => 'nullable|file|image|max:5120',
            'is_active' => 'sometimes|boolean',
            'is_featured' => 'sometimes|boolean',
            'stocks' => 'nullable|array',
            'stocks.*.branch_id' => 'required|exists:branches,id',
            'stocks.*.quantity' => 'required|integer|min:0',
            'stocks.*.price_override' => 'nullable|numeric|min:0',
        ]);

        // Auto-generate slug if not provided
        if (!isset($validated['slug'])) {
            $validated['slug'] = \Illuminate\Support\Str::slug($validated['name']);
        }

        // Handle image uploads
        if ($request->hasFile('images')) {
            $uploadedImages = [];
            foreach ($request->file('images') as $image) {
                $path = $image->store('products', 'public');
                $uploadedImages[] = '/storage/' . $path;
            }
            $validated['images'] = $uploadedImages;
        }

        // Calculate total stock from branch stocks if provided
        if (isset($validated['stocks']) && is_array($validated['stocks'])) {
            $totalStock = array_sum(array_column($validated['stocks'], 'quantity'));
            $validated['stock'] = $totalStock;
        } elseif (!isset($validated['stock'])) {
            $validated['stock'] = 0;
        }

        $dto = ProductDTO::fromRequest($validated);
        $product = $this->productService->createProduct($dto);

        // Set branch-specific stocks if provided
        if (isset($validated['stocks']) && is_array($validated['stocks'])) {
            $this->productService->setBranchStocks($product->id, $validated['stocks']);
        }

        // Broadcast product creation event
        $freshProduct = $product->fresh();
        event(new ProductCreated($freshProduct));

        return response()->json($product, 201);
    }

    public function show(int $id): JsonResponse
    {
        $product = $this->productService->getProductById($id);

        if (!$product) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        return response()->json($product);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => 'sometimes|required|exists:categories,id',
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'sometimes|string|unique:products,slug,' . $id,
            'description' => 'nullable|string',
            'price' => 'sometimes|required|numeric|min:0',
            'sale_price' => 'nullable|numeric|min:0',
            'stock' => 'sometimes|integer|min:0',
            'sku' => 'nullable|string|unique:products,sku,' . $id,
            'images' => 'nullable|array',
            'images.*' => 'nullable|file|image|max:5120',
            'is_active' => 'sometimes|boolean',
            'is_featured' => 'sometimes|boolean',
            'stocks' => 'nullable|array',
            'stocks.*.branch_id' => 'required|exists:branches,id',
            'stocks.*.quantity' => 'required|integer|min:0',
            'stocks.*.price_override' => 'nullable|numeric|min:0',
        ]);

        // Auto-generate slug if not provided
        if (!isset($validated['slug']) && isset($validated['name'])) {
            $validated['slug'] = \Illuminate\Support\Str::slug($validated['name']);
        }

        // Handle image uploads
        if ($request->hasFile('images')) {
            $uploadedImages = [];
            foreach ($request->file('images') as $image) {
                $path = $image->store('products', 'public');
                $uploadedImages[] = '/storage/' . $path;
            }
            $validated['images'] = $uploadedImages;
        }

        // Calculate total stock from branch stocks if provided
        $stocksUpdated = false;
        if (isset($validated['stocks']) && is_array($validated['stocks'])) {
            $totalStock = array_sum(array_column($validated['stocks'], 'quantity'));
            $validated['stock'] = $totalStock;
            $stocksUpdated = true;
        }

        // Get existing product to merge with partial data
        $existing = $this->productService->getProductById($id);
        if (!$existing) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        // Save old stock for event
        $oldStock = $existing->stock;

        // Check if stock field was directly updated
        if (isset($validated['stock']) && $validated['stock'] != $existing->stock) {
            $stocksUpdated = true;
        }

        $dto = ProductDTO::fromPartial($existing, $validated);
        $updated = $this->productService->updateProduct($id, $dto);

        if (!$updated) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        // Update branch-specific stocks if provided
        if (isset($validated['stocks']) && is_array($validated['stocks'])) {
            $this->productService->setBranchStocks($id, $validated['stocks']);
        }

        // Broadcast product update event
        $product = $this->productService->getProductById($id);
        if ($product) {
            event(new ProductUpdated($product));
            
            // Also broadcast stock update if stocks were changed
            if ($stocksUpdated) {
                event(new ProductStockUpdated($product, $oldStock));
            }
        }

        return response()->json(['message' => 'Product updated successfully']);
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->productService->deleteProduct($id);

        if (!$deleted) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        // Broadcast product deletion event
        event(new ProductDeleted($id));

        return response()->json(['message' => 'Product deleted successfully']);
    }

    /**
     * GET /api/v1/admin/products/{id}/stocks
     * Returns per-branch stock rows with quantity and price_override for prefilling the admin form
     */
    public function getBranchStocks(int $id): JsonResponse
    {
        $rows = $this->productService->getAllBranchStocks($id)
            ->map(function ($r) {
                return [
                    'branch_id' => (int) $r->branch_id,
                    'quantity' => (int) ($r->quantity ?? 0),
                    'price_override' => $r->price_override !== null ? (float) $r->price_override : null,
                ];
            });
        return response()->json(['data' => $rows]);
    }
}
