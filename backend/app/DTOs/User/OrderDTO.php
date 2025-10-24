<?php

namespace App\DTOs\User;

use App\DTOs\BaseDTO;

class OrderDTO extends BaseDTO
{
    public function __construct(
        public readonly ?int $userId,
        public readonly string $orderNumber,
        public readonly string $status,
        public readonly float $subtotal,
        public readonly float $tax,
        public readonly float $shipping,
        public readonly float $total,
        public readonly string $paymentMethod,
        public readonly string $paymentStatus,
        public readonly string $shippingAddress,
        public readonly ?string $notes,
        public readonly array $items
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            userId: isset($data['user_id']) && $data['user_id'] !== '' ? (int) $data['user_id'] : null,
            orderNumber: $data['order_number'],
            status: $data['status'] ?? 'pending',
            subtotal: (float) $data['subtotal'],
            tax: (float) ($data['tax'] ?? 0),
            shipping: (float) ($data['shipping'] ?? 0),
            total: (float) $data['total'],
            paymentMethod: $data['payment_method'],
            paymentStatus: $data['payment_status'] ?? 'pending',
            shippingAddress: $data['shipping_address'],
            notes: $data['notes'] ?? null,
            items: $data['items'] ?? []
        );
    }

    public function toArray(): array
    {
        return [
            'user_id' => $this->userId,
            'order_number' => $this->orderNumber,
            'status' => $this->status,
            'subtotal' => $this->subtotal,
            'tax' => $this->tax,
            'shipping' => $this->shipping,
            'total' => $this->total,
            'payment_method' => $this->paymentMethod,
            'payment_status' => $this->paymentStatus,
            'shipping_address' => $this->shippingAddress,
            'notes' => $this->notes,
        ];
    }
}
