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

class WishlistPriceDropped implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Wishlist $wishlist;
    public Product $product;
    public float $oldPrice;
    public float $newPrice;

    /**
     * Create a new event instance.
     */
    public function __construct(Wishlist $wishlist, Product $product, float $oldPrice, float $newPrice)
    {
        $this->wishlist = $wishlist;
        $this->product = $product;
        $this->oldPrice = $oldPrice;
        $this->newPrice = $newPrice;
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
        return 'wishlist.price.dropped';
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
                'old_price' => $this->oldPrice,
                'new_price' => $this->newPrice,
                'discount_percentage' => round((($this->oldPrice - $this->newPrice) / $this->oldPrice) * 100, 1),
                'images' => $this->product->images ?? [],
            ],
            'message' => "Price dropped on {$this->product->name}!",
        ];
    }
}
