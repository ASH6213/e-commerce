<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\DTOs\User\UserLoginDTO;
use App\DTOs\User\UserRegisterDTO;
use App\Services\User\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private AuthService $service)
    {
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required','email','unique:users,email'],
            'fullname' => ['required','string','max:255'],
            'password' => ['required','string','min:6'],
            'shippingAddress' => ['nullable','string','max:500'],
            'phone' => ['nullable','string','max:20'],
        ]);

        try {
            $dto = UserRegisterDTO::fromRequest($validated);
            $result = $this->service->register($dto);

            return response()->json($result, 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => [
                    'message' => $e->getMessage(),
                ],
            ], 400);
        }
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required','email'],
            'password' => ['required','string'],
        ]);

        try {
            // Log for debugging
            \Log::info('Login attempt', [
                'email' => $validated['email'],
                'password_length' => strlen($validated['password']),
            ]);

            $dto = UserLoginDTO::fromRequest($validated);
            $result = $this->service->login($dto);

            \Log::info('Login successful', ['email' => $validated['email']]);

            return response()->json($result, 200);
        } catch (\Exception $e) {
            \Log::error('Login failed', [
                'email' => $validated['email'] ?? 'unknown',
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => [
                    'message' => $e->getMessage(),
                ],
            ], 401);
        }
    }

    public function logout(Request $request): JsonResponse
    {
        try {
            // Revoke all tokens for the authenticated user
            $request->user()->tokens()->delete();

            \Log::info('User logged out', [
                'user_id' => $request->user()->id,
                'email' => $request->user()->email,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully',
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Logout failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => [
                    'message' => 'Logout failed',
                ],
            ], 500);
        }
    }
}
