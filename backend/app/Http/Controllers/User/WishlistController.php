<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\DTOs\User\WishlistDTO;
use App\Services\User\WishlistService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function __construct(
        protected WishlistService $wishlistService
    ) {}

    /**
     * Get user's wishlist
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user_id;
        if (!$userId) {
            return response()->json(['error' => 'User ID required'], 400);
        }

        $wishlists = $this->wishlistService->getUserWishlist($userId);

        return response()->json($wishlists);
    }

    /**
     * Add product to wishlist
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|integer',
            'product_id' => 'required|integer|exists:products,id',
            'notify_on_stock' => 'boolean',
            'notify_on_price_drop' => 'boolean',
        ]);

        try {
            $dto = WishlistDTO::fromRequest($validated);
            $wishlist = $this->wishlistService->addToWishlist($dto);

            return response()->json($wishlist, 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 404);
        }
    }

    /**
     * Remove product from wishlist
     */
    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->wishlistService->removeFromWishlist($id);
        
        if (!$deleted) {
            return response()->json(['error' => 'Wishlist item not found'], 404);
        }

        return response()->json(['message' => 'Removed from wishlist']);
    }

    /**
     * Sync wishlist from cookies to database
     */
    public function sync(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|integer',
            'products' => 'required|array',
            'products.*.id' => 'required|integer|exists:products,id',
        ]);

        $synced = $this->wishlistService->syncWishlist(
            $validated['user_id'],
            $validated['products']
        );

        return response()->json([
            'message' => 'Wishlist synced successfully',
            'synced' => $synced
        ]);
    }
}
