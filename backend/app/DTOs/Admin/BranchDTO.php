<?php

namespace App\DTOs\Admin;

use App\DTOs\BaseDTO;

class BranchDTO extends BaseDTO
{
    public function __construct(
        public readonly string $name,
        public readonly ?string $address,
        public readonly bool $isActive
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            name: $data['name'],
            address: $data['address'] ?? null,
            isActive: (bool) ($data['is_active'] ?? true)
        );
    }

    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'address' => $this->address,
            'is_active' => $this->isActive,
        ];
    }
}
