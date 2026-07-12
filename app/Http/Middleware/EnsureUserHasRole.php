<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * EnsureUserHasRole
 *
 * Route-level gate. This is the real security boundary — the sidebar
 * hiding a nav item is a UX nicety, not protection, since anyone can
 * type a URL directly. This middleware blocks the request with a 403
 * before the controller (and therefore the database) is ever touched.
 *
 * Usage in routes/web.php:
 *   Route::middleware('role:owner')->group(function () { ... });
 *   Route::middleware('role:owner,manager')->group(function () { ... });
 *
 * Register the alias in bootstrap/app.php's ->withMiddleware() callback:
 *   $middleware->alias(['role' => \App\Http\Middleware\EnsureUserHasRole::class]);
 */
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role, $roles, true)) {
            throw new HttpException(403, 'You do not have access to this page.');
        }

        return $next($request);
    }
}
