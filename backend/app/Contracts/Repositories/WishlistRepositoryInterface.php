<?php

namespace App\Contracts\Repositories;

use App\Models\Wishlist;
use Illuminate\Database\Eloquent\Collection;

interface WishlistRepositoryInterface
{
    /**
     * Find wishlist item by ID
     */
    public function findById(int $id): ?Wishlist;

    /**
     * Get all wishlist items for a user
     */
    public function getByUserId(int $userId): Collection;

    /**
     * Create a new wishlist item
     */
    public function create(array $data): Wishlist;

    /**
     * Update or create a wishlist item
     */
    public function updateOrCreate(array $attributes, array $values): Wishlist;

    /**
     * Delete a wishlist item
     */
    public function delete(int $id): bool;

    /**
     * Check if product is in user's wishlist
     */
    public function existsForUser(int $userId, int $productId): bool;

    /**
     * Get wishlist item by user and product
     */
    public function findByUserAndProduct(int $userId, int $productId): ?Wishlist;

    /**
     * Delete all wishlist items for a user
     */
    public function deleteByUserId(int $userId): int;
}
