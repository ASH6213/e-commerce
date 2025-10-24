<?php

namespace App\Events;

use App\Models\Product;
use App\Models\Wishlist;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WishlistBackInStock implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Wishlist $wishlist;
    public Product $product;

    /**
     * Create a new event instance.
     */
    public function __construct(Wishlist $wishlist, Product $product)
    {
        $this->wishlist = $wishlist;
        $this->product = $product;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        // Broadcast to public wishlist channel
        // Frontend will filter by user_id
        return [
            new Channel('wishlist'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'wishlist.back.in.stock';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'user_id' => $this->wishlist->user_id, // Include user_id for filtering
            'wishlist_id' => $this->wishlist->id,
            'product' => [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'slug' => $this->product->slug,
                'price' => $this->product->getCurrentPrice(),
                'stock' => $this->product->stock,
                'images' => $this->product->images ?? [],
            ],
            'message' => "{$this->product->name} is back in stock!",
        ];
    }
}
