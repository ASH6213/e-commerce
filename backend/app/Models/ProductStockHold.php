<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProductStockHold extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id', 'branch_id', 'hold_key', 'quantity', 'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];
}

