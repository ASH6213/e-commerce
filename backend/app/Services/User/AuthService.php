<?php

namespace App\Services\User;

use App\Contracts\Repositories\UserRepositoryInterface;
use App\DTOs\User\UserLoginDTO;
use App\DTOs\User\UserRegisterDTO;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    public function __construct(private UserRepositoryInterface $users)
    {
    }

    public function register(UserRegisterDTO $dto): array
    {
        // Check if user already exists
        $existingUser = $this->users->findByEmail($dto->email);
        if ($existingUser) {
            throw new \Exception('User with this email already exists');
        }

        // Create user
        $userData = $dto->toArray();
        $userData['password'] = Hash::make($dto->password);
        
        $user = $this->users->create($userData);

        $token = $this->generateToken($user);

        return [
            'token' => $token,
            'id' => $user->id,
            'data' => [
                'id' => $user->id,
                'fullname' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone ?? null,
                'shippingAddress' => $user->shipping_address ?? null,
            ],
        ];
    }

    public function login(UserLoginDTO $dto): array
    {
        $user = $this->users->findByEmail($dto->email);

        if (!$user || !Hash::check($dto->password, $user->password)) {
            throw new \Exception('Invalid credentials');
        }

        $token = $this->generateToken($user);

        return [
            'token' => $token,
            'data' => [
                'id' => $user->id,
                'fullname' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone ?? null,
                'shippingAddress' => $user->shipping_address ?? null,
            ],
        ];
    }

    protected function generateToken(User $user): string
    {
        // Issue a Sanctum personal access token
        return $user->createToken('user')->plainTextToken;
    }
}
