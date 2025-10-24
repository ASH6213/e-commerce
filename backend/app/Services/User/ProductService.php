<?php

namespace App\Services\User;

use App\Contracts\Repositories\ProductRepositoryInterface;
use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;

class ProductService
{
    public function __construct(
        protected ProductRepositoryInterface $productRepository
    ) {}

    public function getProductById(int $id): ?Product
    {
        return $this->productRepository->findById($id);
    }

    public function getFeaturedProducts(): Collection
    {
        return $this->productRepository->getFeatured();
    }

    public function searchProducts(string $query): Collection
    {
        return $this->productRepository->search($query);
    }

    public function countProducts(array $filters = []): int
    {
        return $this->productRepository->count($filters);
    }

    public function getProductsWithFilters(array $filters = []): \Illuminate\Support\Collection
    {
        return $this->productRepository->getProductsWithFilters($filters);
    }

    public function getProductWithBranchPricing(int $id, ?int $branchId = null): ?Product
    {
        $product = $this->productRepository->findById($id);
        if (!$product || !$branchId) {
            return $product;
        }

        $branchStock = $this->productRepository->getBranchStock($id, $branchId);
        if ($branchStock) {
            if ($branchStock->price_override !== null) {
                $product->price = (float) $branchStock->price_override;
            }
            $product->branch_stock = (int) ($branchStock->quantity ?? 0);
        } else {
            $product->branch_stock = 0;
        }

        return $product;
    }

    public function getBranchStock(int $productId, int $branchId): ?object
    {
        return $this->productRepository->getBranchStock($productId, $branchId);
    }

    public function updateBranchStock(int $productId, int $branchId, int $quantity): bool
    {
        return $this->productRepository->updateBranchStock($productId, $branchId, $quantity);
    }
}
