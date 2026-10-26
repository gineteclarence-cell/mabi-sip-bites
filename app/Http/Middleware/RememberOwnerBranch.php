<?php
namespace App\Http\Middleware;
use App\Models\Branch;
use Closure;
use Illuminate\Http\Request;
class RememberOwnerBranch {
    public function handle(Request $request, Closure $next) {
        if ($request->user()?->isOwner()) {
            if ($request->isMethod('GET') && $request->query->has('branch_id')) {
                $value = $request->query('branch_id');
                if ($value === 'all' || $value === '') {
                    $request->session()->forget('owner_branch_id');
                    $request->query->remove('branch_id');
                } elseif (ctype_digit((string) $value) && Branch::whereKey((int) $value)->where('status', 'active')->exists()) {
                    $request->session()->put('owner_branch_id', (int) $value);
                } else abort(422, 'Invalid branch selection.');
            } elseif ($request->session()->has('owner_branch_id')) {
                $request->query->set('branch_id', $request->session()->get('owner_branch_id'));
            }
        }
        return $next($request);
    }
}
