<?php

namespace App\Http\Controllers\Admin;

use App\DTOs\Admin\CategoryDTO;
use App\Services\Admin\CategoryService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function __construct(
        protected CategoryService $categoryService
    ) {}

    public function index(): JsonResponse
    {
        $categories = $this->categoryService->getCategoriesWithProductCount();
        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|unique:categories,slug',
            'description' => 'nullable|string',
            'image' => 'nullable|string',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $dto = CategoryDTO::fromRequest($validated);
        $category = $this->categoryService->createCategory($dto);

        return response()->json($category, 201);
    }

    public function show(int $id): JsonResponse
    {
        $category = $this->categoryService->getCategoryById($id);

        if (!$category) {
            return response()->json(['error' => 'Category not found'], 404);
        }

        return response()->json($category);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|unique:categories,slug,' . $id,
            'description' => 'nullable|string',
            'image' => 'nullable|string',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $dto = CategoryDTO::fromRequest($validated);
        $updated = $this->categoryService->updateCategory($id, $dto);

        if (!$updated) {
            return response()->json(['error' => 'Category not found'], 404);
        }

        return response()->json(['message' => 'Category updated successfully']);
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->categoryService->deleteCategory($id);

        if (!$deleted) {
            return response()->json(['error' => 'Category not found'], 404);
        }

        return response()->json(['message' => 'Category deleted successfully']);
    }
}
