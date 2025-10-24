<?php

namespace App\Repositories;

use App\Contracts\Repositories\OrderRepositoryInterface;
use App\Models\Order;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class OrderRepository implements OrderRepositoryInterface
{
    public function __construct(
        protected Order $model
    ) {}

    public function findById(int $id): ?Order
    {
        return $this->model->with(['user', 'items.product'])->find($id);
    }

    public function findByOrderNumber(string $orderNumber): ?Order
    {
        return $this->model->with(['user', 'items.product'])
            ->where('order_number', $orderNumber)
            ->first();
    }

    public function getAll(): Collection
    {
        return $this->model->with(['user', 'items.product'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->with(['user', 'items.product'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function create(array $data): Order
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): bool
    {
        $order = $this->model->find($id);
        return $order ? $order->update($data) : false;
    }

    public function delete(int $id): bool
    {
        $order = $this->model->find($id);
        return $order ? $order->delete() : false;
    }

    public function getByUser(int $userId): Collection
    {
        return $this->model->where('user_id', $userId)
            ->with('items.product')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getByStatus(string $status): Collection
    {
        return $this->model->where('status', $status)
            ->with(['user', 'items.product'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function updateStatus(int $id, string $status): bool
    {
        $order = $this->model->find($id);
        if (!$order) {
            return false;
        }
        
        $order->status = $status;
        return $order->save();
    }

    public function getRecent(int $limit = 10): Collection
    {
        return $this->model->with(['user', 'items.product'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    public function getTotalRevenue(): float
    {
        return (float) $this->model->where('status', 'completed')
            ->sum('total');
    }

    public function findRecentDuplicate(int $userId, float $total, int $seconds = 5): ?Order
    {
        return $this->model->where('user_id', $userId)
            ->where('total', $total)
            ->where('created_at', '>=', now()->subSeconds($seconds))
            ->first();
    }

    public function findRecentDuplicateGuest(string $shippingAddress, float $total, int $seconds = 5): ?Order
    {
        return $this->model
            ->whereNull('user_id')
            ->where('shipping_address', $shippingAddress)
            ->where('total', $total)
            ->where('created_at', '>=', now()->subSeconds($seconds))
            ->first();
    }
}
