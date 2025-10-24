<?php

namespace App\Http\Controllers\Admin;

use App\DTOs\Admin\AdminLoginDTO;
use App\Services\Admin\AuthService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService
    ) {}

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        try {
            $dto = AdminLoginDTO::fromRequest($request->all());
            $result = $this->authService->login($dto);

            return response()->json($result, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => [
                    'message' => $e->getMessage(),
                ],
            ], 401);
        }
    }
}
