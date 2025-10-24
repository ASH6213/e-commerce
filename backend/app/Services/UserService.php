<?php

namespace App\Services;

use App\Contracts\Repositories\UserRepositoryInterface;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class UserService
{
    public function __construct(
        protected UserRepositoryInterface $userRepository
    ) {}

    public function getAllUsers(): Collection
    {
        return $this->userRepository->getAll();
    }

    public function getPaginatedUsers(int $perPage = 15): LengthAwarePaginator
    {
        return $this->userRepository->paginate($perPage);
    }

    public function getUserById(int $id): ?User
    {
        return $this->userRepository->findById($id);
    }

    public function searchUsers(string $query): Collection
    {
        return $this->userRepository->search($query);
    }

    public function getUsersWithOrderStats(): Collection
    {
        return $this->userRepository->getWithOrderStats();
    }

    public function getUserStats(): array
    {
        $users = $this->userRepository->getWithOrderStats();
        
        $totalUsers = $users->count();
        $activeUsers = $users->where('orders_count', '>', 0)->count();
        $totalRevenue = $users->sum('total_spent');
        
        return [
            'totalUsers' => $totalUsers,
            'activeUsers' => $activeUsers,
            'totalRevenue' => (float) ($totalRevenue ?? 0),
        ];
    }

    public function countUsers(): int
    {
        return $this->userRepository->getAll()->count();
    }
}
