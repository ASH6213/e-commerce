<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Services\User\CategoryService;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    public function __construct(private CategoryService $service)
    {
    }

    /**
     * GET /api/v1/categories
     * Returns active categories ordered by sort_order
     */
    public function index(): JsonResponse
    {
        $cats = $this->service->getActiveCategories()
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'image' => $c->image,
            ]);
        return response()->json($cats);
    }
}
