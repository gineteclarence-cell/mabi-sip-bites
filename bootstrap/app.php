<?php

/*
|--------------------------------------------------------------------------
| Phase 10 — bootstrap/app.php middleware alias addition
|--------------------------------------------------------------------------
| Reference only — merge the alias() call into your existing
| ->withMiddleware() callback, alongside the HandleInertiaRequests
| registration from Phase 9. Do not replace your whole bootstrap/app.php
| with this file.
*/

use App\Http\Middleware\EnsureUserHasRole;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        // This line is the new addition for Phase 10 — it's what lets
        // routes/web.php write Route::middleware('role:owner') instead
        // of needing the full class path every time.
        $middleware->alias([
            'role' => EnsureUserHasRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
