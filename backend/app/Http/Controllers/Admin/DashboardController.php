<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\OrderService;
use App\Services\Admin\ProductService;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct(
        protected OrderService $orderService,
        protected ProductService $productService,
        protected UserService $userService
    ) {}

    /**
     * GET /api/v1/admin/dashboard/stats
     * Returns dashboard statistics
     */
    public function stats(): JsonResponse
    {
        \Log::info('Dashboard stats requested');
        
        $orderStats = $this->orderService->getDashboardStats();
        $totalProducts = $this->productService->countProducts([]);
        $totalUsers = $this->userService->countUsers();
        
        \Log::info('Dashboard stats calculated', [
            'products' => $totalProducts,
            'orders' => $orderStats['total_orders'],
            'users' => $totalUsers,
            'revenue' => $orderStats['total_revenue']
        ]);
        
        $data = [
            'totalProducts' => (int) $totalProducts,
            'totalOrders' => (int) $orderStats['total_orders'],
            'totalUsers' => (int) $totalUsers,
            'totalRevenue' => (float) $orderStats['total_revenue'],
            'pendingOrders' => (int) $orderStats['pending_orders'],
            'processingOrders' => (int) $orderStats['processing_orders'],
            'completedOrders' => (int) $orderStats['completed_orders'],
        ];
        
        return response()->json(['data' => $data]);
    }

    /**
     * GET /api/v1/admin/dashboard/recent-orders
     * Returns recent orders for dashboard
     */
    public function recentOrders(): JsonResponse
    {
        $orders = $this->orderService->getRecentOrders(5);
        
        $data = $orders->map(function ($order) {
            return [
                'id' => $order->id,
                'orderNumber' => $order->order_number,
                'customer' => $order->user->fullname ?? 'Guest',
                'total' => (float) $order->total,
                'status' => $order->status,
                'date' => $order->created_at->format('Y-m-d'),
            ];
        });
        
        return response()->json(['data' => $data]);
    }
}
