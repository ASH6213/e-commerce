<?php

namespace App\DTOs\User;

use App\DTOs\BaseDTO;

class WishlistDTO extends BaseDTO
{
    public function __construct(
        public int $userId,
        public int $productId,
        public ?float $priceWhenAdded = null,
        public bool $notifyOnStock = true,
        public bool $notifyOnPriceDrop = true,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            userId: (int) ($data['user_id'] ?? 0),
            productId: (int) ($data['product_id'] ?? 0),
            priceWhenAdded: isset($data['price_when_added']) ? (float) $data['price_when_added'] : null,
            notifyOnStock: (bool) ($data['notify_on_stock'] ?? true),
            notifyOnPriceDrop: (bool) ($data['notify_on_price_drop'] ?? true),
        );
    }

    public function toArray(): array
    {
        return [
            'user_id' => $this->userId,
            'product_id' => $this->productId,
            'price_when_added' => $this->priceWhenAdded,
            'notify_on_stock' => $this->notifyOnStock,
            'notify_on_price_drop' => $this->notifyOnPriceDrop,
        ];
    }
}
