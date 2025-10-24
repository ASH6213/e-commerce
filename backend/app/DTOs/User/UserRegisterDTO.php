<?php

namespace App\DTOs\User;

use App\DTOs\BaseDTO;

class UserRegisterDTO extends BaseDTO
{
    public function __construct(
        public readonly string $email,
        public readonly string $fullname,
        public readonly string $password,
        public readonly ?string $shippingAddress,
        public readonly ?string $phone
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            email: $data['email'],
            fullname: $data['fullname'],
            password: $data['password'],
            shippingAddress: $data['shippingAddress'] ?? $data['shipping_address'] ?? null,
            phone: $data['phone'] ?? null
        );
    }

    public function toArray(): array
    {
        return [
            'email' => $this->email,
            'name' => $this->fullname,
            'password' => $this->password,
            'shipping_address' => $this->shippingAddress,
            'phone' => $this->phone,
        ];
    }
}
