<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\DTOs\Admin\BranchDTO;
use App\Services\Admin\BranchService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BranchController extends Controller
{
    public function __construct(private BranchService $service)
    {
    }

    public function index(): JsonResponse
    {
        return response()->json($this->service->getAll());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required','string','max:255'],
            'address' => ['nullable','string','max:255'],
            'is_active' => ['nullable','boolean'],
        ]);

        $dto = BranchDTO::fromRequest($validated);
        $branch = $this->service->create($dto->toArray());

        return response()->json($branch, 201);
    }

    public function show(int $id): JsonResponse
    {
        $branch = $this->service->find($id);
        if (!$branch) {
            return response()->json(['message' => 'Not found'], 404);
        }
        return response()->json($branch);
    }

    public function update(int $id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required','string','max:255'],
            'address' => ['nullable','string','max:255'],
            'is_active' => ['nullable','boolean'],
        ]);

        $dto = BranchDTO::fromRequest($validated);
        $ok = $this->service->update($id, $dto->toArray());

        if (!$ok) {
            return response()->json(['message' => 'Update failed'], 400);
        }
        return response()->json(['success' => true]);
    }

    public function destroy(int $id): JsonResponse
    {
        $ok = $this->service->delete($id);
        if (!$ok) {
            return response()->json(['message' => 'Delete failed'], 400);
        }
        return response()->json(['success' => true]);
    }
}
