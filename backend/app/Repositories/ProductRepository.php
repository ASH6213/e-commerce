<?php

namespace App\Repositories;

use App\Contracts\Repositories\ProductRepositoryInterface;
use App\Models\Product;
use App\Models\ProductBranchStock;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class ProductRepository implements ProductRepositoryInterface
{
    public function __construct(
        protected Product $model
    ) {}

    public function findById(int $id): ?Product
    {
        return $this->model->with('category')->find($id);
    }

    public function findBySlug(string $slug): ?Product
    {
        return $this->model->with('category')->where('slug', $slug)->first();
    }

    public function getAll(): Collection
    {
        return $this->model->with('category')->get();
    }

    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->with('category')->paginate($perPage);
    }

    public function create(array $data): Product
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): bool
    {
        $product = $this->model->find($id);
        return $product ? $product->update($data) : false;
    }

    public function delete(int $id): bool
    {
        $product = $this->model->find($id);
        return $product ? $product->delete() : false;
    }

    public function getByCategory(int $categoryId): Collection
    {
        return $this->model->with('category')
            ->where('category_id', $categoryId)
            ->where('is_active', true)
            ->get();
    }

    public function getFeatured(): Collection
    {
        return $this->model->with('category')
            ->where('is_featured', true)
            ->where('is_active', true)
            ->get();
    }

    public function getActive(): Collection
    {
        return $this->model->with('category')
            ->where('is_active', true)
            ->get();
    }

    public function search(string $query): Collection
    {
        return $this->model->with('category')
            ->where('name', 'like', "%{$query}%")
            ->orWhere('description', 'like', "%{$query}%")
            ->where('is_active', true)
            ->get();
    }

    public function updateStock(int $id, int $quantity): bool
    {
        $product = $this->model->find($id);
        if (!$product) {
            return false;
        }
        
        $product->stock = $quantity;
        return $product->save();
    }

    public function getByBranch(int $branchId): Collection
    {
        // Join to override price with price_override when provided
        return $this->model->newQuery()
            ->selectRaw('products.*, products.price as base_price, pbs.price_override as branch_price, CASE WHEN COALESCE(pbs.price_override, 0) > 0 THEN pbs.price_override ELSE products.price END as price, CASE WHEN COALESCE(pbs.price_override, 0) > 0 THEN pbs.price_override ELSE products.price END as effective_price')
            ->leftJoin('product_branch_stocks as pbs', function ($join) use ($branchId) {
                $join->on('pbs.product_id', '=', 'products.id')
                     ->where('pbs.branch_id', '=', $branchId);
            })
            ->with('category')
            ->where('is_active', true)
            ->where(function ($q) use ($branchId) {
                $q->whereExists(function ($sub) use ($branchId) {
                    $sub->selectRaw('1')
                        ->from('product_branch_stocks as s')
                        ->whereColumn('s.product_id', 'products.id')
                        ->where('s.branch_id', $branchId)
                        ->where('s.quantity', '>', 0);
                });
            })
            ->get();
    }

    public function setBranchStocks(int $productId, array $branchStocks): bool
    {
        $product = $this->model->find($productId);
        if (!$product) {
            return false;
        }

        foreach ($branchStocks as $row) {
            $branchId = (int)($row['branch_id'] ?? 0);
            $qty = (int)($row['quantity'] ?? 0);
            if ($branchId <= 0) { continue; }

            $payload = [ 'quantity' => $qty ];
            if (array_key_exists('price_override', $row) && $row['price_override'] !== null && $row['price_override'] !== '') {
                $payload['price_override'] = (float)$row['price_override'];
            }
            ProductBranchStock::updateOrCreate(
                [ 'product_id' => $productId, 'branch_id' => $branchId ],
                $payload
            );
        }
        // Recompute overall product stock as the sum of per-branch quantities
        $total = (int) ProductBranchStock::where('product_id', $productId)->sum('quantity');
        $product->stock = $total;
        $product->save();

        return true;
    }

    public function count(array $filters = []): int
    {
        $q = $this->model->newQuery();
        if (!empty($filters['is_active'])) {
            $q->where('is_active', (bool)$filters['is_active']);
        }
        // Filter by category slug if provided
        if (!empty($filters['category'])) {
            $slug = (string)$filters['category'];
            $q->whereHas('category', function ($sub) use ($slug) {
                $sub->where('slug', $slug);
            });
        }
        return (int) $q->count();
    }

    public function getBranchStock(int $productId, int $branchId): ?object
    {
        return ProductBranchStock::where('product_id', $productId)
            ->where('branch_id', $branchId)
            ->first();
    }

    public function getAllBranchStocks(int $productId): \Illuminate\Support\Collection
    {
        return ProductBranchStock::where('product_id', $productId)
            ->get(['branch_id', 'quantity', 'price_override']);
    }

    public function updateBranchStock(int $productId, int $branchId, int $quantity): bool
    {
        $pbs = $this->getBranchStock($productId, $branchId);
        if (!$pbs) {
            return false;
        }
        $pbs->quantity = max(0, $quantity);
        return $pbs->save();
    }

    public function getProductsWithFilters(array $filters = []): \Illuminate\Support\Collection
    {
        $query = $this->model->with(['category', 'branchStocks']);

        // Only show active products to customers (unless explicitly requesting inactive)
        if (!isset($filters['is_active'])) {
            $query->where('is_active', true);
        } elseif ($filters['is_active'] !== null) {
            $query->where('is_active', (bool) $filters['is_active']);
        }

        // Filter by category
        if (!empty($filters['category'])) {
            $query->whereHas('category', function ($q) use ($filters) {
                $q->where('name', $filters['category'])
                  ->orWhere('slug', $filters['category']);
            });
        }

        // Apply ordering
        if (!empty($filters['order_by'])) {
            $orderBy = $filters['order_by'];
            if (str_contains($orderBy, '.')) {
                [$field, $direction] = explode('.', $orderBy);
                $field = $field === 'createdAt' ? 'created_at' : $field;
                $direction = in_array(strtolower($direction), ['asc','desc']) ? strtolower($direction) : 'desc';
                $query->orderBy($field, $direction);
            } else {
                $field = $orderBy === 'createdAt' ? 'created_at' : $orderBy;
                $defaultDirection = ($orderBy === 'price') ? 'asc' : 'desc';
                $query->orderBy($field, $defaultDirection);
            }
        }

        // Apply pagination
        $offset = (int) ($filters['offset'] ?? 0);
        $limit = (int) ($filters['limit'] ?? 100);
        $query->skip($offset)->take($limit);

        $products = $query->get();

        // Apply branch-aware pricing/stock without hiding products for guests
        $branchId = (int) ($filters['branch_id'] ?? 0);
        if ($branchId > 0) {
            foreach ($products as $product) {
                // Base price prefers sale_price if set
                $effective = (float) ($product->sale_price ?? $product->price ?? 0);
                $pbs = $this->getBranchStock($product->id, $branchId);
                if ($pbs) {
                    if ($pbs->price_override !== null) {
                        $effective = (float) $pbs->price_override;
                    }
                    $product->branch_stock = (int) ($pbs->quantity ?? 0);
                } else {
                    // No stock row for this branch means not available in this branch
                    $product->branch_stock = 0;
                }
                // expose the price used on FE
                $product->price = $effective;
            }
        } else {
            // No branch selected: still prefer sale_price if available
            foreach ($products as $product) {
                $product->price = (float) ($product->sale_price ?? $product->price ?? 0);
            }
        }

        return $products;
    }
}
