<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStaffRequest;
use App\Models\Sale;
use App\Models\User;
use App\Traits\BranchScoped;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

class StaffController extends Controller
{
    use BranchScoped;

    public function index(): Response
    {
        $staff = $this->scopeToUserBranch(
            User::query()->where('status', 'active')->with('branch')
        )
            ->orderBy('name')
            ->get();

        $transactionCounts = Sale::query()
            ->whereIn('staff_id', $staff->pluck('id'))
            ->where('status', 'completed')
            ->where('sale_date', '>=', now()->startOfMonth())
            ->selectRaw('staff_id, count(*) as total')
            ->groupBy('staff_id')
            ->pluck('total', 'staff_id');

        $staff = $staff->map(fn (User $user) => $this->presentStaff($user, $transactionCounts->get($user->id, 0)));

        return Inertia::render('Staff/Index', [
            'staff' => $staff,
        ]);
    }

    public function store(StoreStaffRequest $request): RedirectResponse
    {
        $data = $request->validated();

        // Privilege-escalation guard: only an Owner may create another
        // Owner account or a Manager account. Without this, a Manager
        // (who now has route access to /staff per Phase 10) could submit
        // role => 'owner' or role => 'manager' in the form and grant
        // themselves or someone else elevated access. Manager is only
        // permitted to create 'staff' role accounts.
        $this->guardRoleAssignment($data['role']);

        if ($data['role'] !== 'owner') {
            $this->authorizeBranch((int) $data['branch_id']);
        } else {
            $data['branch_id'] = null;
        }

        $data['password'] = Hash::make($data['password']);

        User::create($data);

        return redirect()->back()->with('success', 'Staff member created successfully.');
    }

    public function update(StoreStaffRequest $request, User $staff): RedirectResponse
    {
        // A Manager may only ever touch 'staff'-role records, and only
        // within their own branch. authorizeRecordBranch() alone isn't
        // enough here — Owner's branch_id is null, which happens to fail
        // that check too, but relying on that coincidence is fragile and
        // not self-documenting. This makes the rule explicit: Manager
        // cannot edit Owner or other Manager accounts, full stop,
        // regardless of branch_id.
        $this->guardStaffRecordAccess($staff);
        $this->authorizeRecordBranch($staff);

        $data = $request->validated();

        $this->guardRoleAssignment($data['role']);

        if ($data['role'] !== 'owner') {
            $this->authorizeBranch((int) $data['branch_id']);
        } else {
            $data['branch_id'] = null;
        }

        if (empty($data['password'])) {
            unset($data['password']);
        } else {
            $data['password'] = Hash::make($data['password']);
        }

        $staff->update($data);

        return redirect()->back()->with('success', 'Staff member updated successfully.');
    }

    /**
     * Manager may only assign the 'staff' role. Only Owner may create or
     * promote someone to 'owner' or 'manager'.
     */
    private function guardRoleAssignment(string $targetRole): void
    {
        $actingUser = Auth::user();

        if ($actingUser->isOwner()) {
            return;
        }

        if ($targetRole !== 'staff') {
            throw new HttpException(403, 'Only the owner can assign owner or manager roles.');
        }
    }

    /**
     * Manager may only act on records that are themselves 'staff' role.
     * Owner bypasses this entirely.
     */
    private function guardStaffRecordAccess(User $targetUser): void
    {
        $actingUser = Auth::user();

        if ($actingUser->isOwner()) {
            return;
        }

        if ($targetUser->role !== 'staff') {
            throw new HttpException(403, 'You do not have access to manage this account.');
        }
    }

    private function presentStaff(User $user, int $transactionsThisMonth = 0): array
    {
        return [
            'id' => $user->id,
            'branch_id' => $user->branch_id,
            'branch_name' => $user->branch?->name ? str_replace('Mabi Sip and Bites ', '', $user->branch->name) : '—',
            'name' => $user->name,
            'email' => $user->email,
            'contact_number' => $user->contact_number,
            'role' => $user->role,
            'status' => $user->status,
            'transactions_this_month' => $transactionsThisMonth,
        ];
    }
}
