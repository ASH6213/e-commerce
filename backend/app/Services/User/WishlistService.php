<?php

namespace App\Services\User;

use App\Contracts\Repositories\WishlistRepositoryInterface;
use App\Contracts\Repositories\ProductRepositoryInterface;
use App\DTOs\User\WishlistDTO;
use App\Models\Wishlist;
use Illuminate\Database\Eloquent\Collection;

class WishlistService
{
    public function __construct(
        protected WishlistRepositoryInterface $wishlistRepository,
        protected ProductRepositoryInterface $productRepository
    ) {}

    public function getUserWishlist(int $userId): Collection
    {
        return $this->wishlistRepository->getByUserId($userId);
    }

    public function addToWishlist(WishlistDTO $dto): Wishlist
    {
        // Get product current price
        $product = $this->productRepository->findById($dto->productId);
        
        if (!$product) {
            throw new \Exception('Product not found');
        }

        // Create or update wishlist item
        $wishlist = $this->wishlistRepository->updateOrCreate(
            [
                'user_id' => $dto->userId,
                'product_id' => $dto->productId,
            ],
            [
                'price_when_added' => $dto->priceWhenAdded ?? $product->getCurrentPrice(),
                'notify_on_stock' => $dto->notifyOnStock,
                'notify_on_price_drop' => $dto->notifyOnPriceDrop,
            ]
        );

        \Log::info("Product added to wishlist", [
            'user_id' => $dto->userId,
            'product_id' => $dto->productId,
            'price' => $product->getCurrentPrice()
        ]);

        return $wishlist->load('product');
    }

    public function removeFromWishlist(int $id): bool
    {
        $deleted = $this->wishlistRepository->delete($id);
        
        if ($deleted) {
            \Log::info("Product removed from wishlist", [
                'wishlist_id' => $id
            ]);
        }

        return $deleted;
    }

    public function syncWishlist(int $userId, array $products): array
    {
        $synced = [];
        
        foreach ($products as $item) {
            $product = $this->productRepository->findById($item['id']);
            if (!$product) {
                continue;
            }

            $wishlist = $this->wishlistRepository->updateOrCreate(
                [
                    'user_id' => $userId,
                    'product_id' => $item['id'],
                ],
                [
                    'price_when_added' => $product->getCurrentPrice(),
                    'notify_on_stock' => true,
                    'notify_on_price_drop' => true,
                ]
            );
            $synced[] = $wishlist;
        }

        \Log::info("Wishlist synced from cookies to database", [
            'user_id' => $userId,
            'items_synced' => count($synced)
        ]);

        return $synced;
    }

    public function isInWishlist(int $userId, int $productId): bool
    {
        return $this->wishlistRepository->existsForUser($userId, $productId);
    }

    public function clearUserWishlist(int $userId): int
    {
        return $this->wishlistRepository->deleteByUserId($userId);
    }
}
