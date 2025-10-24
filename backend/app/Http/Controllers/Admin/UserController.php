<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    public function __construct(
        protected UserService $userService
    ) {}

    /**
     * GET /api/v1/admin/users
     * Returns all users with their order statistics
     */
    public function index(): JsonResponse
    {
        $users = $this->userService->getUsersWithOrderStats();
        
        $data = $users->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->fullname ?? 'Unknown User',
                'email' => $user->email ?? '',
                'phone' => $user->phone ?? '',
                'orders' => (int) ($user->orders_count ?? 0),
                'totalSpent' => (float) ($user->total_spent ?? 0),
                'status' => $this->getUserStatus($user),
                'joinedDate' => $user->created_at->format('Y-m-d'),
            ];
        });
        
        return response()->json(['data' => $data]);
    }
    
    /**
     * GET /api/v1/admin/users/stats
     * Returns user statistics for the users page
     */
    public function stats(): JsonResponse
    {
        $stats = $this->userService->getUserStats();
        
        return response()->json(['data' => $stats]);
    }
    
    /**
     * Determine user status based on their orders
     */
    private function getUserStatus($user): string
    {
        // User is active if they have placed at least one order
        return ($user->orders_count ?? 0) > 0 ? 'Active' : 'Inactive';
    }
}
