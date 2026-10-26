<?php

namespace App\Traits;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * BranchScoped
 *
 * Centralizes the access rule from 00_CLAUDE_PROJECT_INSTRUCTIONS.md and
 * 07_BACKEND_CONTROLLERS_AND_ROUTES.md: "Never let staff see or change
 * records outside assigned branch." Owner role bypasses scoping entirely
 * (sees/manages both branches); manager and staff are restricted to their
 * own branch_id.
 *
 * Every controller that touches a branch-scoped model (Product, Sale,
 * StaffTask, AttendanceLog, User-as-staff) uses this trait instead of
 * writing its own ad-hoc branch check, so the rule can never drift
 * between modules.
 */
trait BranchScoped
{
    /**
     * Apply branch scoping to a query builder. Owner gets the query
     * unmodified; everyone else is constrained to their own branch_id.
     */
    protected function scopeToUserBranch(Builder $query, string $branchColumn = 'branch_id'): Builder
    {
        /** @var User $user */
        $user = Auth::user();

        if ($user->isOwner()) {
            // Owner's selected branch is persisted server-side by RememberOwnerBranch.
            // A missing selection means the owner intentionally selected All branches.
            $selected = request()->integer('branch_id');
            return $selected ? $query->where($branchColumn, $selected) : $query;
        }

        return $query->where($branchColumn, $user->branch_id);
    }

    /**
     * Throw a 403 if the given branch_id doesn't belong to the current
     * user (owner is always allowed). Use this when validating incoming
     * branch_id on create/update requests, so a manager/staff member
     * can't submit a form with a different branch's ID and write into it.
     */
    protected function authorizeBranch(?int $branchId): void
    {
        /** @var User $user */
        $user = Auth::user();

        if ($user->isOwner()) {
            return;
        }

        if ($branchId !== $user->branch_id) {
            throw new HttpException(403, 'You do not have access to that branch.');
        }
    }

    /**
     * Throw a 403 if the given model instance's branch_id doesn't belong
     * to the current user. Use this in show/edit/update/destroy/archive
     * actions on an already-loaded record.
     */
    protected function authorizeRecordBranch($record, string $branchColumn = 'branch_id'): void
    {
        $this->authorizeBranch($record->{$branchColumn});
    }
}
