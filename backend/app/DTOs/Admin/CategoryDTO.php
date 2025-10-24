<?php

namespace App\DTOs\Admin;

use App\DTOs\BaseDTO;

class CategoryDTO extends BaseDTO
{
    public function __construct(
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $description,
        public readonly ?string $image,
        public readonly bool $isActive,
        public readonly int $sortOrder
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            name: $data['name'],
            slug: $data['slug'],
            description: $data['description'] ?? null,
            image: $data['image'] ?? null,
            isActive: (bool) ($data['is_active'] ?? true),
            sortOrder: (int) ($data['sort_order'] ?? 0)
        );
    }

    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'image' => $this->image,
            'is_active' => $this->isActive,
            'sort_order' => $this->sortOrder,
        ];
    }
}
