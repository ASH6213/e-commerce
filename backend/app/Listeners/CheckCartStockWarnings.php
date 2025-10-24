<?php

namespace App\Listeners;

use App\Events\ProductStockUpdated;
use App\Events\CartStockWarning;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class CheckCartStockWarnings implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle product stock updated events to check for cart warnings
     */
    public function handle(ProductStockUpdated $event): void
    {
        $product = $event->product;
        
        \Log::info(" Checking cart stock warnings for product #{$product->id}", [
            'stock' => $product->stock
        ]);

        // Check if stock is low (less than 5)
        if ($product->stock > 0 && $product->stock < 5) {
            \Log::info("Low stock warning for product #{$product->id}: {$product->stock} remaining");
            event(new CartStockWarning($product, $product->stock, 'low_stock'));
        }
        
        // Check if out of stock
        if ($product->stock == 0) {
            \Log::info(" Out of stock warning for product #{$product->id}");
            event(new CartStockWarning($product, 0, 'out_of_stock'));
        }
    }
}
