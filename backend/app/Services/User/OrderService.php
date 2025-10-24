<?php

namespace App\Services\User;

use App\Contracts\Repositories\OrderRepositoryInterface;
use App\DTOs\User\OrderDTO;
use App\Models\Order;

class OrderService
{
    public function __construct(
        protected OrderRepositoryInterface $orderRepository
    ) {}

    public function createOrder(OrderDTO $dto): Order
    {
        $order = $this->orderRepository->create($dto->toArray());

        // Create order items
        foreach ($dto->items as $item) {
            $order->items()->create($item);
        }

        return $order->load('items');
    }

    public function getUserOrders(int $userId)
    {
        return $this->orderRepository->getByUser($userId);
    }

    public function getOrderById(int $id): ?Order
    {
        return $this->orderRepository->findById($id);
    }

    public function isDuplicateOrder(?int $userId, float $total, string $shippingAddress = '', int $seconds = 5): bool
    {
        if ($userId && $userId > 0) {
            $recentOrder = $this->orderRepository->findRecentDuplicate($userId, $total, $seconds);
            return $recentOrder !== null;
        }
        if ($shippingAddress !== '') {
            $recentOrder = $this->orderRepository->findRecentDuplicateGuest($shippingAddress, $total, $seconds);
            return $recentOrder !== null;
        }
        return false;
    }
}
