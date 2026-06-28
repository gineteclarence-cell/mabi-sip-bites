<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

/**
 * HandleInertiaRequests
 *
 * This is the piece that was missing across every prior phase: nothing
 * ever shared `flash` as an Inertia prop, so every page's Toast Flash
 * Bridge (the `useEffect` watching `flash?.success` / `flash?.error` in
 * AppLayout.jsx, Login.jsx, and Register.jsx) was watching a prop that
 * never arrived. Controllers have been calling
 * `redirect()->back()->with('success', '...')` since Phase 7, which
 * writes to the session flash bag correctly — but without this share()
 * method pulling those session values into Inertia's shared props on
 * every single request, the frontend had no way to see them.
 */
class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Defines the props that are shared by default.
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),

            'auth' => [
                'user' => $request->user(),
            ],

            // Read once per request, not once per controller — every
            // redirect()->back()->with('success'|'error', $message) call
            // anywhere in the app lands here automatically.
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],

            // Branch selector data for Header.jsx's owner-only branch
            // switcher (referenced since Phase 4, never actually wired
            // until now).
            'branches' => fn () => $request->user()
                ? \App\Models\Branch::where('status', 'active')->get(['id', 'name'])
                : [],
        ];
    }
}
