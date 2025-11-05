<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\BranchController as AdminBranchController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\ProductStockController as AdminProductStockController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\User\ProductController;
use App\Http\Controllers\User\OrderController;
use App\Http\Controllers\User\AuthController as UserAuthController;
use App\Http\Controllers\User\BranchController;
use App\Http\Controllers\User\CategoryController;
use App\Http\Controllers\User\WishlistController;
use App\Http\Controllers\User\StockController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Health check
Route::get('/health', fn () => response()->json(['status' => 'ok']));

// API v1 routes
    Route::prefix('v1')->group(function () {
        // Public branches
        Route::get('/branches', [BranchController::class, 'index']);
        // Public products
        Route::get('/products', [ProductController::class, 'index']);
        // Place specific product routes before the dynamic {id} route
        Route::get('/products/count', [ProductController::class, 'count']);
        Route::get('/products/featured', [ProductController::class, 'featured']);
        Route::get('/products/search', [ProductController::class, 'search']);
        Route::get('/products/{id}', [ProductController::class, 'show'])->whereNumber('id');
        // Public orders
        Route::post('/orders', [OrderController::class, 'store']);
        Route::get('/orders/mine', [OrderController::class, 'mine']);
        // Stock holds for checkout
        Route::post('/stock/hold', [StockController::class, 'hold']);
        Route::post('/stock/release', [StockController::class, 'release']);
        
        // Wishlist routes
        Route::get('/wishlist', [WishlistController::class, 'index']);
        Route::post('/wishlist', [WishlistController::class, 'store']);
        Route::post('/wishlist/sync', [WishlistController::class, 'sync']);
        Route::delete('/wishlist/{id}', [WishlistController::class, 'destroy']);
        
        // Public categories
        Route::get('/categories', [CategoryController::class, 'index']);
        
        // User auth
        Route::prefix('auth')->group(function () {
            Route::post('/register', [UserAuthController::class, 'register']);
            Route::post('/login', [UserAuthController::class, 'login']);
            Route::post('/logout', [UserAuthController::class, 'logout'])->middleware('auth:sanctum');
        });

        Route::prefix('admin')->group(function () {
            // Public admin auth
            Route::prefix('auth')->group(function () {
                Route::post('/login', [AdminAuthController::class, 'login']);
            });

            // Protected admin routes (Sanctum + custom admin.auth)
            Route::middleware(['auth:sanctum','admin.auth'])->group(function () {
                // Dashboard (admin)
                Route::get('/dashboard/stats', [AdminDashboardController::class, 'stats']);
                Route::get('/dashboard/recent-orders', [AdminDashboardController::class, 'recentOrders']);

                // Users (admin)
                Route::get('/users', [AdminUserController::class, 'index']);
                Route::get('/users/stats', [AdminUserController::class, 'stats']);

                // Products (admin)
                Route::get('/products', [AdminProductController::class, 'index']);
                Route::post('/products', [AdminProductController::class, 'store']);
                Route::put('/products/{id}', [AdminProductController::class, 'update']);
                Route::get('/products/{id}/stocks', [AdminProductController::class, 'getBranchStocks']);
                Route::delete('/products/{id}', [AdminProductController::class, 'destroy']);

                // Categories (admin)
                Route::get('/categories', [AdminCategoryController::class, 'index']);
                Route::post('/categories', [AdminCategoryController::class, 'store']);
                Route::put('/categories/{id}', [AdminCategoryController::class, 'update']);
                Route::delete('/categories/{id}', [AdminCategoryController::class, 'destroy']);

                // Branches (admin)
                Route::post('/branches', [AdminBranchController::class, 'store']);
                // Update per-branch stock for a product
                Route::post('/products/{id}/stock', [AdminProductStockController::class, 'setStock']);

                // Orders (admin)
                Route::get('/orders', [AdminOrderController::class, 'index']);
                Route::get('/orders/{id}', [AdminOrderController::class, 'show']);
                Route::put('/orders/{id}/status', [AdminOrderController::class, 'updateStatus']);
            });
        });
});

// Add your API routes here
// Example:
// Route::prefix('products')->group(function () {
//     Route::get('/', [ProductController::class, 'index']);
//     Route::post('/', [ProductController::class, 'store']);
//     Route::get('/{id}', [ProductController::class, 'show']);
//     Route::put('/{id}', [ProductController::class, 'update']);
//     Route::delete('/{id}', [ProductController::class, 'destroy']);
// });
