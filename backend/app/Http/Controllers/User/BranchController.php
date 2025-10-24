<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Services\User\BranchService;
use Illuminate\Http\JsonResponse;

class BranchController extends Controller
{
    public function __construct(private BranchService $service)
    {
    }

    public function index(): JsonResponse
    {
        return response()->json($this->service->getActive());
    }

    public function show(int $id): JsonResponse
    {
        $branch = $this->service->find($id);
        if (!$branch) {
            return response()->json(['message' => 'Not found'], 404);
        }
        return response()->json($branch);
    }
}
