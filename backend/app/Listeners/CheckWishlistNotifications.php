<?php

namespace App\Listeners;

use App\Events\ProductStockUpdated;
use App\Events\ProductUpdated;
use App\Events\WishlistBackInStock;
use App\Events\WishlistPriceDropped;
use App\Models\Wishlist;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class CheckWishlistNotifications implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle product updated events to check for wishlist notifications
     */
    public function handle(ProductUpdated|ProductStockUpdated $event): void
    {
        $product = $event->product;
        $oldStock = property_exists($event, 'oldStock') ? $event->oldStock : null;
        
        // Get all wishlists for this product
        $wishlists = Wishlist::where('product_id', $product->id)
            ->with('user')
            ->get();

        if ($wishlists->isEmpty()) {
            return;
        }

        \Log::info("Checking wishlist notifications for product #{$product->id}", [
            'wishlists_count' => $wishlists->count(),
            'old_stock' => $oldStock,
            'new_stock' => $product->stock
        ]);

        foreach ($wishlists as $wishlist) {
            // Check for price drop
            if ($wishlist->notify_on_price_drop && $wishlist->price_when_added) {
                $this->checkPriceDrop($wishlist, $product);
            }

            // Check for back in stock
            if ($wishlist->notify_on_stock) {
                $this->checkBackInStock($wishlist, $product, $oldStock);
            }
        }
    }

    /**
     * Check if price has dropped
     */
    private function checkPriceDrop(Wishlist $wishlist, $product): void
    {
        $currentPrice = $product->getCurrentPrice();
        $priceWhenAdded = (float) $wishlist->price_when_added;

        // Price has dropped by at least 5%
        if ($currentPrice < $priceWhenAdded) {
            $dropPercentage = (($priceWhenAdded - $currentPrice) / $priceWhenAdded) * 100;
            
            if ($dropPercentage >= 5) {
                \Log::info("Price dropped for wishlist #{$wishlist->id}", [
                    'product_id' => $product->id,
                    'old_price' => $priceWhenAdded,
                    'new_price' => $currentPrice,
                    'drop_percentage' => $dropPercentage
                ]);

                event(new WishlistPriceDropped($wishlist, $product, $priceWhenAdded, $currentPrice));
                
                // Update the price so we don't notify again for the same drop
                $wishlist->price_when_added = $currentPrice;
                $wishlist->save();
            }
        }
    }

    /**
     * Check if product is back in stock
     */
    private function checkBackInStock(Wishlist $wishlist, $product, ?int $oldStock = null): void
    {
        // Only notify if product was OUT of stock and is now IN stock
        // If oldStock is not provided, we can't determine the transition, so skip
        if ($oldStock === null) {
            \Log::debug("No old stock data, skipping back-in-stock check", [
                'product_id' => $product->id
            ]);
            return;
        }
        
        // Product WAS out of stock (old stock = 0) and NOW in stock (stock > 0)
        $wasOutOfStock = $oldStock == 0;
        $isNowInStock = $product->isInStock();
        
        if ($wasOutOfStock && $isNowInStock) {
            \Log::info("Product back in stock for wishlist #{$wishlist->id}", [
                'product_id' => $product->id,
                'old_stock' => $oldStock,
                'new_stock' => $product->stock
            ]);

            event(new WishlistBackInStock($wishlist, $product));
        } else {
            \Log::debug("Skipping back-in-stock notification", [
                'product_id' => $product->id,
                'was_out_of_stock' => $wasOutOfStock,
                'is_now_in_stock' => $isNowInStock,
                'old_stock' => $oldStock,
                'new_stock' => $product->stock
            ]);
        }
    }
}
