<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'description',
        'price',
        'sale_price',
        'stock',
        'sku',
        'images',
        'is_active',
        'is_featured',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'sale_price' => 'decimal:2',
            'stock' => 'integer',
            'images' => 'array',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
        ];
    }

    /**
     * Normalize stored image paths to relative "/storage/..." URLs for API responses.
     * This avoids depending on APP_URL. Frontend prefixes relative paths with NEXT_PUBLIC_BACKEND_URL.
     */
    public function getImagesAttribute($value): array
    {
        $images = is_array($value) ? $value : (json_decode($value, true) ?: []);

        $toRelative = function ($path) {
            if (!is_string($path) || $path === '') return null;
            // Keep absolute URLs as-is
            if (Str::startsWith($path, ['http://', 'https://'])) {
                // If absolute URL contains /storage/, strip origin to return relative
                $pos = strpos($path, '/storage/');
                if ($pos !== false) {
                    return substr($path, $pos);
                }
                return $path;
            }
            // Already a relative storage URL
            if (Str::startsWith($path, ['/storage/'])) {
                return $path;
            }
            // Convert storage paths like public/products/... to /storage/products/...
            return Storage::url($path);
        };

        $normalized = [];
        foreach ($images as $item) {
            $rel = $toRelative($item);
            if ($rel) { $normalized[] = $rel; }
        }
        return $normalized;
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function branchStocks(): HasMany
    {
        return $this->hasMany(ProductBranchStock::class);
    }

    public function isInStock(): bool
    {
        return $this->stock > 0;
    }

    public function getCurrentPrice(): float
    {
        return $this->sale_price ?? $this->price;
    }
}
