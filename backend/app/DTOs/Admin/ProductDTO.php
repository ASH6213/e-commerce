<?php

namespace App\DTOs\Admin;

use App\DTOs\BaseDTO;
use App\Models\Product;

class ProductDTO extends BaseDTO
{
    public function __construct(
        public readonly int $categoryId,
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $description,
        public readonly float $price,
        public readonly ?float $salePrice,
        public readonly int $stock,
        public readonly ?string $sku,
        public readonly ?array $images,
        public readonly bool $isActive,
        public readonly bool $isFeatured
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            categoryId: (int) ($data['category_id'] ?? 0),
            name: $data['name'] ?? '',
            slug: $data['slug'] ?? '',
            description: $data['description'] ?? null,
            price: (float) ($data['price'] ?? 0),
            salePrice: isset($data['sale_price']) && $data['sale_price'] !== '' ? (float) $data['sale_price'] : null,
            stock: (int) ($data['stock'] ?? 0),
            sku: $data['sku'] ?? null,
            images: $data['images'] ?? null,
            isActive: (bool) ($data['is_active'] ?? true),
            isFeatured: (bool) ($data['is_featured'] ?? false)
        );
    }

    /**
     * Build a full DTO for update by merging a partial payload with an existing Product model.
     */
    public static function fromPartial(Product $existing, array $partial): self
    {
        return new self(
            categoryId: (int) ($partial['category_id'] ?? $existing->category_id),
            name: (string) ($partial['name'] ?? $existing->name),
            slug: (string) ($partial['slug'] ?? $existing->slug ?? ''),
            description: array_key_exists('description', $partial) ? ($partial['description'] ?? null) : $existing->description,
            price: (float) ($partial['price'] ?? $existing->price),
            salePrice: array_key_exists('sale_price', $partial)
                ? ($partial['sale_price'] !== null ? (float)$partial['sale_price'] : null)
                : $existing->sale_price,
            stock: (int) ($partial['stock'] ?? $existing->stock),
            sku: array_key_exists('sku', $partial) ? ($partial['sku'] ?? null) : $existing->sku,
            images: array_key_exists('images', $partial) ? ($partial['images'] ?? null) : $existing->images,
            isActive: (bool) ($partial['is_active'] ?? $existing->is_active),
            isFeatured: (bool) ($partial['is_featured'] ?? $existing->is_featured),
        );
    }

    public function toArray(): array
    {
        return [
            'category_id' => $this->categoryId,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'price' => $this->price,
            'sale_price' => $this->salePrice,
            'stock' => $this->stock,
            'sku' => $this->sku,
            'images' => $this->images,
            'is_active' => $this->isActive,
            'is_featured' => $this->isFeatured,
        ];
    }
}
