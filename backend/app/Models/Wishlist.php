<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Wishlist extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'product_id',
        'price_when_added',
        'notify_on_stock',
        'notify_on_price_drop',
    ];

    protected function casts(): array
    {
        return [
            'price_when_added' => 'decimal:2',
            'notify_on_stock' => 'boolean',
            'notify_on_price_drop' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
