<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStaffRequest;
use App\Models\Sale;
use App\Models\User;
use App\Traits\BranchScoped;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

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

        // Per 07_BACKEND_CONTROLLERS_AND_ROUTES.md "Staff Performance
        // Metrics": transaction count per staff, this month. Computed as
        // one grouped query rather than looping a count() per staff
        // member, to avoid N+1 queries on a page that can list every
        // staff member in the branch.
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
        $this->authorizeRecordBranch($staff);

        $data = $request->validated();

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
