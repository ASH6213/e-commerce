<?php

namespace App\Contracts\Repositories;

use App\Models\Order;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface OrderRepositoryInterface
{
    public function findById(int $id): ?Order;
    
    public function findByOrderNumber(string $orderNumber): ?Order;
    
    public function getAll(): Collection;
    
    public function paginate(int $perPage = 15): LengthAwarePaginator;
    
    public function create(array $data): Order;
    
    public function update(int $id, array $data): bool;
    
    public function delete(int $id): bool;
    
    public function getByUser(int $userId): Collection;
    
    public function getByStatus(string $status): Collection;
    
    public function updateStatus(int $id, string $status): bool;
    
    public function getRecent(int $limit = 10): Collection;
    
    public function getTotalRevenue(): float;
    
    public function findRecentDuplicate(int $userId, float $total, int $seconds = 5): ?Order;

    public function findRecentDuplicateGuest(string $shippingAddress, float $total, int $seconds = 5): ?Order;
}
