<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StaffTask;
use App\Models\User;
use App\Traits\BranchScoped;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ArchiveController extends Controller
{
    use BranchScoped;

    /**
     * Whitelist mapping from URL module segment to model class and the
     * status value that means "archived" for that model. Sale uses
     * 'completed' as its active state (not 'active') per
     * 02_DATABASE_DESIGN.md's sales.status enum, so this is explicit per
     * module rather than assumed to be uniform.
     *
     * SECURITY NOTE: {module} in the route is raw user input. We never
     * pass it to a class-resolution function directly (no
     * "App\\Models\\".ucfirst($module) string-building, no app($module)).
     * Only modules present in this array can be archived/restored/deleted;
     * anything else 404s before touching the database.
     */
    private const MODULE_MAP = [
        'branches' => ['model' => Branch::class, 'activeStatus' => 'active'],
        'inventory' => ['model' => Product::class, 'activeStatus' => 'active'],
        'staff' => ['model' => User::class, 'activeStatus' => 'active'],
        'sales' => ['model' => Sale::class, 'activeStatus' => 'completed'],
        'tasks' => ['model' => StaffTask::class, 'activeStatus' => 'pending'],
    ];

    public function index(): Response
    {
        $tabs = [];

        foreach (self::MODULE_MAP as $module => $config) {
            $modelClass = $config['model'];

            $query = $modelClass::query()->where('status', 'archived');

            $eagerLoads = match ($module) {
                'inventory', 'sales', 'tasks' => ['branch'],
                default => [],
            };

            if ($module === 'tasks') {
                $eagerLoads[] = 'assignee';
            }

            if (! empty($eagerLoads)) {
                $query->with($eagerLoads);
            }

            if (in_array($module, ['inventory', 'staff', 'sales', 'tasks'], true)) {
                $query = $this->scopeToUserBranch($query);
            }

            $tabs[$module] = $query->get()->map(fn (Model $record) => $this->presentArchived($module, $record));
        }

        return Inertia::render('Archived/Index', [
            'archivedRecords' => $tabs,
        ]);
    }

    public function archive(string $module, int $id): RedirectResponse
    {
        $record = $this->resolveRecord($module, $id);
        $this->authorizeRecordBranchIfApplicable($module, $record);

        // status and archived_at are set via direct attribute assignment
        // + save(), not update([...]), because archived_at is intentionally
        // absent from every model's $fillable array (it's a system-managed
        // timestamp, not something a form should ever mass-assign). Using
        // update() here would silently drop archived_at since Eloquent
        // ignores non-fillable keys passed to mass-assignment methods.
        $record->status = 'archived';
        $record->archived_at = now();
        $record->save();

        return redirect()->back()->with('success', 'Record archived successfully.');
    }

    public function restore(string $module, int $id): RedirectResponse
    {
        $record = $this->resolveRecord($module, $id, onlyArchived: true);
        $this->authorizeRecordBranchIfApplicable($module, $record);

        $record->status = self::MODULE_MAP[$module]['activeStatus'];
        $record->archived_at = null;
        $record->save();

        return redirect()->back()->with('success', 'Record restored successfully.');
    }

    public function destroy(string $module, int $id): RedirectResponse
    {
        $record = $this->resolveRecord($module, $id, onlyArchived: true);
        $this->authorizeRecordBranchIfApplicable($module, $record);

        $record->delete();

        return redirect()->back()->with('success', 'Record deleted successfully.');
    }

    private function resolveRecord(string $module, int $id, bool $onlyArchived = false): Model
    {
        if (! array_key_exists($module, self::MODULE_MAP)) {
            throw new NotFoundHttpException("Unknown module: {$module}");
        }

        $modelClass = self::MODULE_MAP[$module]['model'];
        $query = $modelClass::query();

        if ($onlyArchived) {
            $query->where('status', 'archived');
        }

        $record = $query->find($id);

        if (! $record) {
            throw new NotFoundHttpException('Record not found.');
        }

        return $record;
    }

    /**
     * Branches and Staff(owner records) don't carry a branch_id to scope
     * against in every case (Branch itself has no branch_id; an owner
     * User has branch_id = null), so scoping only applies where the model
     * actually has a meaningful branch_id to check.
     */
    private function authorizeRecordBranchIfApplicable(string $module, Model $record): void
    {
        if ($module === 'branches') {
            // Only owner manages branches at all — checked at the route
            // middleware / controller level for BranchController; mirror
            // that here for the archive/restore/delete actions too.
            if (! Auth::user()->isOwner()) {
                abort(403, 'You do not have access to manage branches.');
            }
            return;
        }

        if ($module === 'staff') {
            // Manager may only archive/restore/delete 'staff'-role
            // accounts, never 'owner' or 'manager' accounts (including
            // their own peers in the same branch). Owner-role records
            // also have no branch_id to scope against, so this check
            // has to come before the generic authorizeRecordBranch()
            // call below regardless of role.
            if (! Auth::user()->isOwner() && $record->role !== 'staff') {
                abort(403, 'You do not have access to manage this account.');
            }

            if (Auth::user()->isOwner()) {
                return;
            }
        }

        $this->authorizeRecordBranch($record);
    }

    private function presentArchived(string $module, Model $record): array
    {
        return match ($module) {
            'branches' => [
                'id' => $record->id,
                'name' => $record->name,
                'location' => $record->location,
                'contact_number' => $record->contact_number,
            ],
            'inventory' => [
                'id' => $record->id,
                'name' => $record->name,
                'category' => $record->category,
                'branch_name' => $record->branch?->name ? str_replace('Mabi Sip and Bites ', '', $record->branch->name) : '',
                'stock' => $record->stock,
            ],
            'staff' => [
                'id' => $record->id,
                'name' => $record->name,
                'email' => $record->email,
                'role' => $record->role,
            ],
            'sales' => [
                'id' => $record->id,
                'transaction_number' => $record->transaction_number,
                'branch_name' => $record->branch?->name ? str_replace('Mabi Sip and Bites ', '', $record->branch->name) : '',
                'total_amount' => (float) $record->total_amount,
            ],
            'tasks' => [
                'id' => $record->id,
                'title' => $record->title,
                'branch_name' => $record->branch?->name ? str_replace('Mabi Sip and Bites ', '', $record->branch->name) : '',
                'assigned_to_name' => $record->assignee?->name ?? '',
            ],
            default => ['id' => $record->id],
        };
    }
}
