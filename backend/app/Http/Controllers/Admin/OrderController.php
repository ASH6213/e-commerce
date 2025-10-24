<?php

namespace App\Http\Controllers\Admin;

use App\Events\OrderStatusUpdated;
use App\Http\Controllers\Controller;
use App\Services\Admin\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(private OrderService $orders)
    {
    }

    /**
     * GET /api/v1/admin/orders
     */
    public function index(Request $request): JsonResponse
    {
        \Log::info('Admin orders index called', [
            'per_page' => $request->query('per_page', 50),
            'user' => $request->user()?->id ?? 'none',
        ]);
        
        $perPage = (int) $request->query('per_page', 50);
        $data = $this->orders->getPaginatedOrders($perPage);
        
        \Log::info('Orders fetched', [
            'count' => $data->count(),
            'total' => $data->total(),
        ]);
        
        return response()->json($data);
    }

    /**
     * GET /api/v1/admin/orders/{id}
     */
    public function show(int $id): JsonResponse
    {
        $order = $this->orders->getOrderById($id);
        if (!$order) {
            return response()->json(['message' => 'Not found'], 404);
        }
        return response()->json($order->load(['user', 'items']));
    }

    /**
     * PUT /api/v1/admin/orders/{id}/status
     */
    public function updateStatus(int $id, Request $request): JsonResponse
    {
        try {
            \Log::info("Order status update request", [
                'order_id' => $id,
                'payload' => $request->all()
            ]);

            $validated = $request->validate([
                'status' => ['required','string','in:pending,processing,shipped,completed,cancelled,delivered']
            ]);
            
            // Get order before update to track previous status
            $order = $this->orders->getOrderById($id);
            if (!$order) {
                \Log::warning("Order #{$id} not found");
                return response()->json(['message' => 'Order not found'], 404);
            }
            
            $previousStatus = $order->status;
            \Log::info("Updating order #{$id} status from '{$previousStatus}' to '{$validated['status']}'");
            
            $ok = $this->orders->updateOrderStatus($id, $validated['status']);
            
            if ($ok) {
                // Broadcast order status update event
                $updatedOrder = $this->orders->getOrderById($id);
                if ($updatedOrder) {
                    event(new OrderStatusUpdated($updatedOrder, $previousStatus));
                    \Log::info("OrderStatusUpdated event dispatched for order #{$id}");
                }
                return response()->json(['updated' => true, 'message' => 'Status updated successfully']);
            }
            
            \Log::error("Failed to update order #{$id} status");
            return response()->json(['message' => 'Update failed'], 400);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error("Validation error for order #{$id}", [
                'errors' => $e->errors()
            ]);
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error("Exception updating order #{$id} status", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Internal server error',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

