<?php

namespace App\Services\Admin;

use App\Contracts\Repositories\AdminRepositoryInterface;
use App\DTOs\Admin\AdminLoginDTO;
use App\Models\Admin;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    public function __construct(
        protected AdminRepositoryInterface $adminRepository
    ) {}

    public function login(AdminLoginDTO $dto): array
    {
        $admin = $this->adminRepository->findByEmail($dto->email);

        if (!$admin || !Hash::check($dto->password, $admin->password)) {
            throw new \Exception('Invalid credentials');
        }

        if (!$admin->is_active) {
            throw new \Exception('Account is inactive');
        }

        $token = $this->generateToken($admin);

        return [
            'token' => $token,
            'data' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => $admin->role,
            ],
        ];
    }

    protected function generateToken(Admin $admin): string
    {
        // Issue a Sanctum personal access token with admin abilities
        return $admin->createToken('admin')->plainTextToken;
    }

    public function validateToken(string $token): ?Admin
    {
        try {
            // Sanctum token format: {id}|{token_hash}
            // Use Sanctum's built-in token validation
            $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
            
            if (!$accessToken) {
                \Log::warning('Invalid token: not found in database', ['token_prefix' => substr($token, 0, 10)]);
                return null;
            }
            
            // Get the tokenable (Admin model)
            $admin = $accessToken->tokenable;
            
            if (!$admin instanceof Admin) {
                \Log::warning('Token does not belong to an admin', ['tokenable_type' => get_class($admin)]);
                return null;
            }
            
            if (!$admin->is_active) {
                \Log::warning('Admin account is inactive', ['admin_id' => $admin->id]);
                return null;
            }
            
            return $admin;
        } catch (\Exception $e) {
            \Log::error('Token validation error', [
                'error' => $e->getMessage(),
                'token_prefix' => substr($token, 0, 10)
            ]);
            return null;
        }
    }
}
