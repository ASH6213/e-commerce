<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Services\User\ProductService;
use App\Services\User\BranchService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    public function __construct(private ProductService $service, private BranchService $branches)
    {
    }

    /**
     * GET /api/v1/products
     * Optional query: branch_id to filter by branch availability
     * Optional query: category to filter by category name
     * Optional query: order_by, offset, limit for pagination and sorting
     */
    public function index(Request $request): JsonResponse
    {
        $branchId = (int) $request->query('branch_id', 0);
        if ($branchId <= 0) {
            $default = $this->branches->getDefaultBranchId();
            if ($default) { $branchId = (int) $default; }
        }

        $filters = [
            'branch_id' => $branchId,
            'category' => $request->query('category'),
            'order_by' => $request->query('order_by', 'createdAt.desc'),
            'offset' => (int) $request->query('offset', 0),
            'limit' => (int) $request->query('limit', 100),
        ];

        $products = $this->service->getProductsWithFilters($filters);

        return ProductResource::collection($products)->response();
    }

    /**
     * GET /api/v1/products/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $branchId = (int) $request->query('branch_id', 0);
        if ($branchId <= 0) {
            $default = $this->branches->getDefaultBranchId();
            if ($default) { $branchId = (int) $default; }
        }
        $product = $this->service->getProductWithBranchPricing($id, $branchId > 0 ? $branchId : null);
        
        if (!$product) {
            return response()->json(['message' => 'Not found'], 404);
        }
        // Return unwrapped object to keep FE compatibility
        return response()->json((new ProductResource($product))->toArray($request));
    }

    /**
     * GET /api/v1/products/count
     */
    public function count(Request $request): JsonResponse
    {
        $filters = [];
        if ($request->has('category')) {
            $filters['category'] = (string)$request->query('category');
        }
        if ($request->has('is_active')) {
            $filters['is_active'] = (bool)$request->query('is_active');
        }
        $total = $this->service->countProducts($filters);
        return response()->json(['count' => $total]);
    }

    /**
     * GET /api/v1/products/featured
     */
    public function featured(): JsonResponse
    {
        return ProductResource::collection($this->service->getFeaturedProducts())->response();
    }

    /**
     * GET /api/v1/products/search?q=...
     */
    public function search(Request $request): JsonResponse
    {
        $q = (string)$request->query('q', '');
        if ($q === '') {
            return response()->json([]);
        }
        return ProductResource::collection($this->service->searchProducts($q))->response();
    }
}
