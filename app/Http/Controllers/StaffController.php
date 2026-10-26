<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStaffRequest;
use App\Models\Branch;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

class StaffController extends Controller
{
    public function index(Request $request): Response
    {
        $actingUser = $request->user();

        $isOwner = $actingUser->isOwner();

        $selectedBranchId = null;

        /*
        |--------------------------------------------------------------------------
        | Base staff query
        |--------------------------------------------------------------------------
        */

        $query = User::query()
            ->where('status', 'active')
            ->with('branch');

        /*
        |--------------------------------------------------------------------------
        | Owner branch filtering
        |--------------------------------------------------------------------------
        |
        | /staff
        |      = all branches
        |
        | /staff?branch_id=1
        |      = Branch 1
        |
        | /staff?branch_id=2
        |      = Branch 2
        |
        */

        if ($isOwner) {
            $requestedBranchId =
                $request->integer('branch_id');

            if ($requestedBranchId) {
                $branchExists = Branch::query()
                    ->whereKey($requestedBranchId)
                    ->where('status', 'active')
                    ->exists();

                if ($branchExists) {
                    $selectedBranchId =
                        $requestedBranchId;

                    $query->where(
                        'branch_id',
                        $requestedBranchId
                    );
                }
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Manager scope
        |--------------------------------------------------------------------------
        |
        | Manager can ONLY see staff from their own branch.
        | They cannot use ?branch_id= to access another branch.
        |
        */

        else {
            $selectedBranchId =
                $actingUser->branch_id;

            $query
                ->where(
                    'branch_id',
                    $actingUser->branch_id
                )
                ->where(
                    'role',
                    'staff'
                );
        }

        /*
        |--------------------------------------------------------------------------
        | Staff list
        |--------------------------------------------------------------------------
        */

        $staff = $query
            ->orderBy('name')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Monthly transaction counts
        |--------------------------------------------------------------------------
        */

        $transactionCounts = Sale::query()
            ->whereIn(
                'staff_id',
                $staff->pluck('id')
            )
            ->where(
                'status',
                'completed'
            )
            ->where(
                'sale_date',
                '>=',
                now()->copy()->startOfMonth()
            )
            ->selectRaw(
                'staff_id, count(*) as total'
            )
            ->groupBy('staff_id')
            ->pluck(
                'total',
                'staff_id'
            );

        $staff = $staff
            ->map(
                fn (User $user) =>
                    $this->presentStaff(
                        $user,
                        (int) $transactionCounts->get(
                            $user->id,
                            0
                        )
                    )
            )
            ->values();

        return Inertia::render(
            'Staff/Index',
            [
                'staff' =>
                    $staff,

                'selectedBranchId' =>
                    $selectedBranchId,
            ]
        );
    }

    public function store(
        StoreStaffRequest $request
    ): RedirectResponse {
        $data =
            $request->validated();

        /*
        |--------------------------------------------------------------------------
        | Role protection
        |--------------------------------------------------------------------------
        */

        $this->guardRoleAssignment(
            $data['role']
        );

        if (
            $data['role'] !==
            'owner'
        ) {
            $this->authorizeBranch(
                (int) $data['branch_id']
            );
        } else {
            $data['branch_id'] =
                null;
        }

        $data['password'] =
            Hash::make(
                $data['password']
            );

        User::create(
            $data
        );

        return back()->with(
            'success',
            'Staff member created successfully.'
        );
    }

    public function update(
        StoreStaffRequest $request,
        User $staff
    ): RedirectResponse {
        /*
        |--------------------------------------------------------------------------
        | Record access
        |--------------------------------------------------------------------------
        */

        $this->guardStaffRecordAccess(
            $staff
        );

        $actingUser =
            Auth::user();

        /*
         * Manager may only edit records
         * inside their branch.
         */
        if (
            ! $actingUser->isOwner() &&
            (int) $staff->branch_id !==
                (int) $actingUser->branch_id
        ) {
            abort(403);
        }

        $data =
            $request->validated();

        $this->guardRoleAssignment(
            $data['role']
        );

        /*
        |--------------------------------------------------------------------------
        | Branch assignment
        |--------------------------------------------------------------------------
        */

        if (
            $data['role'] !==
            'owner'
        ) {
            $this->authorizeBranch(
                (int) $data['branch_id']
            );
        } else {
            $data['branch_id'] =
                null;
        }

        /*
        |--------------------------------------------------------------------------
        | Password update
        |--------------------------------------------------------------------------
        |
        | Existing passwords cannot be retrieved.
        |
        | Blank = keep current password
        | Filled = replace with new password
        |
        */

        if (
            empty(
                $data['password']
            )
        ) {
            unset(
                $data['password']
            );
        } else {
            $data['password'] =
                Hash::make(
                    $data['password']
                );
        }

        $staff->update(
            $data
        );

        return back()->with(
            'success',
            'Staff member updated successfully.'
        );
    }

    private function guardRoleAssignment(
        string $targetRole
    ): void {
        $actingUser =
            Auth::user();

        if (
            $actingUser->isOwner()
        ) {
            return;
        }

        if (
            $targetRole !==
            'staff'
        ) {
            throw new HttpException(
                403,
                'Only the owner can assign owner or manager roles.'
            );
        }
    }

    private function guardStaffRecordAccess(
        User $targetUser
    ): void {
        $actingUser =
            Auth::user();

        if (
            $actingUser->isOwner()
        ) {
            return;
        }

        if (
            $targetUser->role !==
            'staff'
        ) {
            throw new HttpException(
                403,
                'You do not have access to manage this account.'
            );
        }
    }

    private function authorizeBranch(
        int $branchId
    ): void {
        $actingUser =
            Auth::user();

        /*
         * Owner can assign any active branch.
         */
        if (
            $actingUser->isOwner()
        ) {
            $exists =
                Branch::query()
                    ->whereKey(
                        $branchId
                    )
                    ->where(
                        'status',
                        'active'
                    )
                    ->exists();

            abort_unless(
                $exists,
                422
            );

            return;
        }

        /*
         * Manager can only assign their own branch.
         */
        abort_unless(
            (int) $actingUser->branch_id ===
                $branchId,
            403
        );
    }

    private function presentStaff(
        User $user,
        int $transactionsThisMonth = 0
    ): array {
        return [
            'id' =>
                $user->id,

            'branch_id' =>
                $user->branch_id,

            'branch_name' =>
                $user->branch?->name
                    ? str_replace(
                        'Mabi Sip and Bites ',
                        '',
                        $user->branch->name
                    )
                    : '—',

            'name' =>
                $user->name,

            'email' =>
                $user->email,

            'contact_number' =>
                $user->contact_number,

            'role' =>
                $user->role,

            'status' =>
                $user->status,

            'transactions_this_month' =>
                $transactionsThisMonth,
        ];
    }
}