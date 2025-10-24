<?php

namespace App\Repositories;

use App\Contracts\Repositories\WishlistRepositoryInterface;
use App\Models\Wishlist;
use Illuminate\Database\Eloquent\Collection;

class WishlistRepository implements WishlistRepositoryInterface
{
    public function __construct(
        protected Wishlist $model
    ) {}

    public function findById(int $id): ?Wishlist
    {
        return $this->model->with('product')->find($id);
    }

    public function getByUserId(int $userId): Collection
    {
        return $this->model->where('user_id', $userId)
            ->with('product')
            ->get();
    }

    public function create(array $data): Wishlist
    {
        return $this->model->create($data);
    }

    public function updateOrCreate(array $attributes, array $values): Wishlist
    {
        return $this->model->updateOrCreate($attributes, $values);
    }

    public function delete(int $id): bool
    {
        $wishlist = $this->model->find($id);
        return $wishlist ? $wishlist->delete() : false;
    }

    public function existsForUser(int $userId, int $productId): bool
    {
        return $this->model->where('user_id', $userId)
            ->where('product_id', $productId)
            ->exists();
    }

    public function findByUserAndProduct(int $userId, int $productId): ?Wishlist
    {
        return $this->model->where('user_id', $userId)
            ->where('product_id', $productId)
            ->with('product')
            ->first();
    }

    public function deleteByUserId(int $userId): int
    {
        return $this->model->where('user_id', $userId)->delete();
    }
}
