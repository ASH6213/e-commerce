<?php

namespace App\Providers;

use App\Events\ProductUpdated;
use App\Events\ProductStockUpdated;
use App\Listeners\CheckWishlistNotifications;
use App\Listeners\CheckCartStockWarnings;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register wishlist notification listeners
        Event::listen(ProductUpdated::class, CheckWishlistNotifications::class);
        Event::listen(ProductStockUpdated::class, CheckWishlistNotifications::class);
        
        // Register cart stock warning listeners
        Event::listen(ProductStockUpdated::class, CheckCartStockWarnings::class);
    }
}
