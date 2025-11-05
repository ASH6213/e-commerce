<?php

namespace App\Contracts\Repositories;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface ProductRepositoryInterface
{
    public function findById(int $id): ?Product;
    
    public function findBySlug(string $slug): ?Product;
    
    public function getAll(): Collection;
    
    public function paginate(int $perPage = 15): LengthAwarePaginator;
    
    public function create(array $data): Product;
    
    public function update(int $id, array $data): bool;
    
    public function delete(int $id): bool;
    
    public function getByCategory(int $categoryId): Collection;
    
    public function getFeatured(): Collection;
    
    public function getActive(): Collection;
    
    public function search(string $query): Collection;
    
    public function updateStock(int $id, int $quantity): bool;

    /**
     * Get active products available in a specific branch (quantity > 0)
     */
    public function getByBranch(int $branchId): Collection;

    /**
     * Set per-branch stock for a product. Payload example:
     * [ ['branch_id' => 1, 'quantity' => 5], ... ]
     */
    public function setBranchStocks(int $productId, array $branchStocks): bool;

    /**
     * Count products matching optional filters (e.g., ['category' => 'women']).
     */
    public function count(array $filters = []): int;

    /**
     * Get branch stock for a product
     */
    public function getBranchStock(int $productId, int $branchId): ?object;

    /**
     * Get all branch stocks for a product
     */
    public function getAllBranchStocks(int $productId): \Illuminate\Support\Collection;

    /**
     * Update branch stock quantity
     */
    public function updateBranchStock(int $productId, int $branchId, int $quantity): bool;

    /**
     * Get products with filters, ordering, and pagination
     */
    public function getProductsWithFilters(array $filters = []): \Illuminate\Support\Collection;

    /**
     * Get available quantity in a branch, subtracting active holds.
     * If $excludeHoldKey is provided, holds with that key are excluded from the subtraction.
     */
    public function getAvailableBranchQuantity(int $productId, int $branchId, ?string $excludeHoldKey = null): int;

    /**
     * Get available global quantity (no branch), subtracting active holds.
     * If $excludeHoldKey is provided, holds with that key are excluded from the subtraction.
     */
    public function getAvailableGlobalQuantity(int $productId, ?string $excludeHoldKey = null): int;
}
