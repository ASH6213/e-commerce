<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class OrderCreated implements ShouldBroadcastNow
{
    use InteractsWithSockets, SerializesModels;

    public function __construct(public Order $order)
    {
        $this->order->loadMissing(['items', 'user']);
    }

    public function broadcastOn(): Channel
    {
        // Public channel; no auth required for admin dashboard listeners
        return new Channel('orders');
    }

    public function broadcastAs(): string
    {
        return 'order.created';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->order->id,
            'orderNumber' => (string) $this->order->order_number,
            'total' => (float) $this->order->total,
            'status' => (string) $this->order->status,
            'createdAt' => (string) $this->order->created_at,
        ];
    }
}
