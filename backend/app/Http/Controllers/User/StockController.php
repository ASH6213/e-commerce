<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\ProductStockHold;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockController extends Controller
{
    /**
     * POST /api/v1/stock/hold
     * Payload: { holdKey?: string, branchId?: number, ttl_seconds?: number, products: [{id, quantity}] }
     * Creates or refreshes holds for the given items. Returns holdKey and expiry.
     */
    public function hold(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'holdKey' => 'nullable|string|max:100',
            'branchId' => 'nullable|integer|min:0',
            'ttl_seconds' => 'nullable|integer|min:60|max:3600',
            'products' => 'required|array|min:1',
            'products.*.id' => 'required|integer|min:1',
            'products.*.quantity' => 'required|integer|min:1',
        ]);

        $holdKey = $validated['holdKey'] ?? bin2hex(random_bytes(8));
        $branchId = (int) ($validated['branchId'] ?? 0);
        $ttl = (int) ($validated['ttl_seconds'] ?? 600); // default 10 minutes
        $expiresAt = now()->addSeconds($ttl);

        foreach ($validated['products'] as $row) {
            ProductStockHold::updateOrCreate(
                [
                    'product_id' => (int) $row['id'],
                    'branch_id' => $branchId > 0 ? $branchId : null,
                    'hold_key' => $holdKey,
                ],
                [
                    'quantity' => (int) $row['quantity'],
                    'expires_at' => $expiresAt,
                ]
            );
        }

        return response()->json([
            'success' => true,
            'holdKey' => $holdKey,
            'expires_at' => (string) $expiresAt,
        ]);
    }

    /**
     * POST /api/v1/stock/release
     * Payload: { holdKey: string }
     */
    public function release(Request $request): JsonResponse
    {
        $request->validate(['holdKey' => 'required|string|max:100']);
        $count = ProductStockHold::where('hold_key', (string) $request->input('holdKey'))
            ->delete();
        return response()->json(['success' => true, 'released' => (int) $count]);
    }
}


