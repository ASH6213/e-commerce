<?php

namespace App\Services\Admin;

use App\Contracts\Repositories\ProductRepositoryInterface;
use App\DTOs\Admin\ProductDTO;
use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProductService
{
    public function __construct(
        protected ProductRepositoryInterface $productRepository
    ) {}

    public function getAllProducts(): Collection
    {
        return $this->productRepository->getAll();
    }

    public function getPaginatedProducts(int $perPage = 15): LengthAwarePaginator
    {
        return $this->productRepository->paginate($perPage);
    }

    public function getProductById(int $id): ?Product
    {
        return $this->productRepository->findById($id);
    }

    public function createProduct(ProductDTO $dto): Product
    {
        return $this->productRepository->create($dto->toArray());
    }

    public function updateProduct(int $id, ProductDTO $dto): bool
    {
        return $this->productRepository->update($id, $dto->toArray());
    }

    public function deleteProduct(int $id): bool
    {
        return $this->productRepository->delete($id);
    }

    public function getProductsByCategory(int $categoryId): Collection
    {
        return $this->productRepository->getByCategory($categoryId);
    }

    public function getFeaturedProducts(): Collection
    {
        return $this->productRepository->getFeatured();
    }

    public function searchProducts(string $query): Collection
    {
        return $this->productRepository->search($query);
    }

    public function updateStock(int $id, int $quantity): bool
    {
        return $this->productRepository->updateStock($id, $quantity);
    }

    public function getProductsByBranch(int $branchId): Collection
    {
        return $this->productRepository->getByBranch($branchId);
    }

    public function setBranchStocks(int $productId, array $branchStocks): bool
    {
        return $this->productRepository->setBranchStocks($productId, $branchStocks);
    }

    public function countProducts(array $filters = []): int
    {
        return $this->productRepository->count($filters);
    }

    public function getAllBranchStocks(int $productId): \Illuminate\Support\Collection
    {
        return $this->productRepository->getAllBranchStocks($productId);
    }
}
