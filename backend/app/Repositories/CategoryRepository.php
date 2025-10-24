<?php

namespace App\Repositories;

use App\Contracts\Repositories\CategoryRepositoryInterface;
use App\Models\Category;
use Illuminate\Database\Eloquent\Collection;

class CategoryRepository implements CategoryRepositoryInterface
{
    public function __construct(
        protected Category $model
    ) {}

    public function findById(int $id): ?Category
    {
        return $this->model->find($id);
    }

    public function findBySlug(string $slug): ?Category
    {
        return $this->model->where('slug', $slug)->first();
    }

    public function getAll(): Collection
    {
        return $this->model->orderBy('sort_order')->get();
    }

    public function create(array $data): Category
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): bool
    {
        $category = $this->findById($id);
        return $category ? $category->update($data) : false;
    }

    public function delete(int $id): bool
    {
        $category = $this->findById($id);
        return $category ? $category->delete() : false;
    }

    public function getActive(): Collection
    {
        return $this->model->where('is_active', true)
            ->orderBy('sort_order')
            ->get();
    }

    public function getWithProductCount(): Collection
    {
        return $this->model->withCount('products')
            ->orderBy('sort_order')
            ->get();
    }
}
