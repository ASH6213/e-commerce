<?php

namespace App\Events;

use App\Models\Product;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProductCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Product $product;

    /**
     * Create a new event instance.
     */
    public function __construct(Product $product)
    {
        $this->product = $product;
        Log::info('🎯 ProductCreated event constructed', ['product_id' => $product->id, 'name' => $product->name]);
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        Log::info('📡 Broadcasting ProductCreated on channel: products');
        return [
            new Channel('products'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'product.created';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        $data = [
            'product' => [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'slug' => $this->product->slug,
                'price' => $this->product->price,
                'sale_price' => $this->product->sale_price,
                'stock' => $this->product->stock,
                'images' => $this->product->images,
                'is_active' => $this->product->is_active,
                'is_featured' => $this->product->is_featured,
                'category_id' => $this->product->category_id,
                'created_at' => $this->product->created_at,
            ],
        ];
        Log::info('📦 Broadcasting data', $data);
        return $data;
    }
}
