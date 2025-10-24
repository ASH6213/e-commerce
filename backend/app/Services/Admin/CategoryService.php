<?php

namespace App\Services\Admin;

use App\Contracts\Repositories\CategoryRepositoryInterface;
use App\DTOs\Admin\CategoryDTO;
use App\Models\Category;
use Illuminate\Database\Eloquent\Collection;

class CategoryService
{
    public function __construct(
        protected CategoryRepositoryInterface $categoryRepository
    ) {}

    public function getAllCategories(): Collection
    {
        return $this->categoryRepository->getAll();
    }

    public function getCategoryById(int $id): ?Category
    {
        return $this->categoryRepository->findById($id);
    }

    public function createCategory(CategoryDTO $dto): Category
    {
        return $this->categoryRepository->create($dto->toArray());
    }

    public function updateCategory(int $id, CategoryDTO $dto): bool
    {
        return $this->categoryRepository->update($id, $dto->toArray());
    }

    public function deleteCategory(int $id): bool
    {
        return $this->categoryRepository->delete($id);
    }

    public function getCategoriesWithProductCount(): Collection
    {
        return $this->categoryRepository->getWithProductCount();
    }
}
