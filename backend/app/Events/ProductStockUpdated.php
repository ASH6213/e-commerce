<?php

namespace App\Events;

use App\Models\Product;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProductStockUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Product $product;
    public int $oldStock;

    /**
     * Create a new event instance.
     */
    public function __construct(Product $product, int $oldStock = 0)
    {
        $this->product = $product;
        $this->oldStock = $oldStock;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('products'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'product.stock.updated';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        // Load relationships
        $this->product->load(['category', 'branchStocks']);
        
        return [
            'product' => [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'slug' => $this->product->slug,
                'stock' => $this->product->stock,
                'price' => $this->product->price,
                'sale_price' => $this->product->sale_price,
                'is_active' => $this->product->is_active,
                'images' => $this->product->images ?? [],
                'category' => $this->product->category ? [
                    'id' => $this->product->category->id,
                    'name' => $this->product->category->name,
                ] : null,
                'branch_stock' => $this->product->branchStocks->map(function ($bs) {
                    return [
                        'branch_id' => $bs->branch_id,
                        'quantity' => $bs->quantity,
                        'price_override' => $bs->price_override,
                    ];
                })->toArray(),
            ],
        ];
    }
}
