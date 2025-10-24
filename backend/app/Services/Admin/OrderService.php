<?php

namespace App\Services\Admin;

use App\Contracts\Repositories\OrderRepositoryInterface;
use App\Models\Order;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class OrderService
{
    public function __construct(
        protected OrderRepositoryInterface $orderRepository
    ) {}

    public function getAllOrders(): Collection
    {
        return $this->orderRepository->getAll();
    }

    public function getPaginatedOrders(int $perPage = 15): LengthAwarePaginator
    {
        return $this->orderRepository->paginate($perPage);
    }

    public function getOrderById(int $id): ?Order
    {
        return $this->orderRepository->findById($id);
    }

    public function updateOrderStatus(int $id, string $status): bool
    {
        return $this->orderRepository->updateStatus($id, $status);
    }

    public function getOrdersByStatus(string $status): Collection
    {
        return $this->orderRepository->getByStatus($status);
    }

    public function getRecentOrders(int $limit = 10): Collection
    {
        return $this->orderRepository->getRecent($limit);
    }

    public function getTotalRevenue(): float
    {
        return $this->orderRepository->getTotalRevenue();
    }

    public function getDashboardStats(): array
    {
        $orders = $this->orderRepository->getAll();
        
        return [
            'total_orders' => $orders->count(),
            'pending_orders' => $orders->where('status', 'pending')->count(),
            'processing_orders' => $orders->where('status', 'processing')->count(),
            'completed_orders' => $orders->where('status', 'completed')->count(),
            'total_revenue' => $this->getTotalRevenue(),
        ];
    }
}
