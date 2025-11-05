<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $basePrice = $this->price ?? 0;
        $salePrice = $this->sale_price;
        $effective = $salePrice !== null ? $salePrice : $basePrice;

        return [
            'id' => (int) $this->id,
            'name' => (string) ($this->name ?? ''),
            'slug' => (string) ($this->slug ?? ''),
            'description' => $this->description,
            'price' => (float) $basePrice,
            'sale_price' => $salePrice !== null ? (float) $salePrice : null,
            'effective_price' => (float) $effective,
            'stock' => isset($this->stock) ? (int) $this->stock : 0,
            'branch_stock' => isset($this->branch_stock) ? (int) $this->branch_stock : null,
            'sku' => $this->sku,
            'images' => is_array($this->images) ? $this->images : [],
            'is_active' => (bool) ($this->is_active ?? false),
            'is_featured' => (bool) ($this->is_featured ?? false),
            'category_id' => $this->category_id ? (int) $this->category_id : null,
            'category' => $this->whenLoaded('category', function () {
                return [
                    'id' => (int) $this->category->id,
                    'name' => (string) $this->category->name,
                ];
            }),
        ];
    }
}

