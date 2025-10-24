<?php

namespace App\Events;

use App\Models\Product;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CartStockWarning implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Product $product;
    public int $availableStock;
    public string $warningType; // 'low_stock', 'out_of_stock'

    /**
     * Create a new event instance.
     */
    public function __construct(Product $product, int $availableStock, string $warningType)
    {
        $this->product = $product;
        $this->availableStock = $availableStock;
        $this->warningType = $warningType;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        // Broadcast to public cart channel
        return [
            new Channel('cart'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'cart.stock.warning';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        $message = $this->warningType === 'out_of_stock' 
            ? "{$this->product->name} is now out of stock!"
            : "Only {$this->availableStock} left for {$this->product->name}!";

        return [
            'product' => [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'slug' => $this->product->slug,
                'available_stock' => $this->availableStock,
                'price' => $this->product->getCurrentPrice(),
                'images' => $this->product->images ?? [],
            ],
            'warning_type' => $this->warningType,
            'message' => $message,
        ];
    }
}
