<?php

namespace App\Http\Controllers\Admin;

use App\Events\ProductStockUpdated;
use App\Http\Controllers\Controller;
use App\Services\Admin\ProductService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProductStockController extends Controller
{
    public function __construct(private ProductService $service)
    {
    }

    /**
     * Set per-branch stock for a product
     * Payload example: { stocks: [ { branch_id: 1, quantity: 5 }, ... ] }
     */
    public function setStock(int $id, Request $request): JsonResponse
    {
        \Log::info("Stock update request for product #{$id}", [
            'payload' => $request->all()
        ]);

        $validated = $request->validate([
            'stocks' => ['required','array','min:1'],
            'stocks.*.branch_id' => ['required','integer','exists:branches,id'],
            'stocks.*.quantity' => ['required','integer','min:0'],
            'stocks.*.price_override' => ['nullable','numeric','min:0'],
        ]);

        // Check if product exists
        $product = $this->service->getProductById($id);
        if (!$product) {
            \Log::warning("Product #{$id} not found");
            return response()->json([
                'success' => false,
                'message' => 'Product not found',
            ], 404);
        }

        // Save old stock before updating
        $oldStock = $product->stock;
        
        \Log::info("Product found, updating stocks...", [
            'old_stock' => $oldStock
        ]);
        
        $ok = $this->service->setBranchStocks($id, $validated['stocks']);

        if ($ok) {
            // Reload product to get updated stock
            $product = $this->service->getProductById($id);
            \Log::info("Stock updated successfully", [
                'old_stock' => $oldStock,
                'new_stock' => $product->stock
            ]);
            
            if ($product) {
                event(new ProductStockUpdated($product, $oldStock));
                \Log::info("ProductStockUpdated event dispatched");
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Stock updated successfully',
                'total_stock' => $product->stock,
            ], 200);
        }

        \Log::error("Failed to update stock");
        return response()->json([
            'success' => false,
            'message' => 'Failed to update stock',
        ], 400);
    }
}
