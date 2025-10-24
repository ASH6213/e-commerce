<?php

namespace App\Http\Middleware;

use App\Services\Admin\AuthService;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAuthMiddleware
{
    public function __construct(private AuthService $auth)
    {
    }

    public function handle(Request $request, Closure $next): JsonResponse|\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
    {
        \Log::info('Admin auth middleware called', [
            'path' => $request->path(),
            'method' => $request->method(),
        ]);
        
        $token = $this->extractToken($request);

        if (!$token) {
            \Log::warning('Admin auth failed: missing token', [
                'path' => $request->path(),
                'headers' => $request->headers->all(),
            ]);
            return response()->json([
                'error' => [
                    'message' => 'Unauthorized: missing token',
                ],
            ], 401);
        }

        \Log::info('Token extracted', ['token_prefix' => substr($token, 0, 15)]);

        $admin = $this->auth->validateToken($token);
        if (!$admin) {
            \Log::warning('Admin auth failed: invalid token', [
                'token_prefix' => substr($token, 0, 15),
            ]);
            return response()->json([
                'error' => [
                    'message' => 'Unauthorized: invalid or expired token',
                ],
            ], 401);
        }

        \Log::info('Admin authenticated successfully', [
            'admin_id' => $admin->id,
            'admin_email' => $admin->email,
        ]);

        // Optionally set current admin on request for downstream usage
        $request->attributes->set('admin', $admin);

        return $next($request);
    }

    private function extractToken(Request $request): ?string
    {
        // Authorization: Bearer <token>
        $authHeader = $request->header('Authorization');
        if (is_string($authHeader) && str_starts_with($authHeader, 'Bearer ')) {
            return trim(substr($authHeader, 7));
        }

        // Fallback header
        $xToken = $request->header('X-Admin-Token');
        if ($xToken) {
            return (string) $xToken;
        }

        // Optional cookie (not reliable cross-site, but useful if same-site)
        $cookie = $request->cookie('admin');
        if ($cookie) {
            try {
                $decoded = json_decode((string) $cookie, true);
                if (is_array($decoded) && isset($decoded['token'])) {
                    return (string) $decoded['token'];
                }
            } catch (\Throwable $_) {
                // ignore
            }
        }

        return null;
    }
}

