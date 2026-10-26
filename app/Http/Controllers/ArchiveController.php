<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Ingredient;
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

    private const MODULE_MAP = [
        'branches' => ['model' => Branch::class, 'activeStatus' => 'active'],
        'inventory' => ['model' => Ingredient::class, 'activeStatus' => 'active'],
        'staff' => ['model' => User::class, 'activeStatus' => 'active'],
        'sales' => ['model' => Sale::class, 'activeStatus' => 'completed'],
        'tasks' => ['model' => StaffTask::class, 'activeStatus' => 'pending'],
    ];

    private function allowedModules(): array
    {
        return match (Auth::user()->role) {
            'owner' => ['branches', 'staff'],
            'staff' => ['inventory', 'tasks'],
            'manager' => ['inventory', 'tasks'],
            default => [],
        };
    }

    private function authorizeModule(string $module): void
    {
        abort_unless(in_array($module, $this->allowedModules(), true), 403);
    }

    public function index(): Response
    {
        $tabs = [];

        foreach (self::MODULE_MAP as $module => $config) {
            if (! in_array($module, $this->allowedModules(), true)) {
                continue;
            }
            $modelClass = $config['model'];
            $query = $modelClass::query()->where('status', 'archived');

            $eagerLoads = match ($module) {
                'inventory', 'sales', 'tasks' => ['branch'],
                default => [],
            };

            if ($module === 'tasks') {
                $eagerLoads[] = 'assignee';
            }

            if ($eagerLoads !== []) {
                $query->with($eagerLoads);
            }

            if (in_array($module, ['inventory', 'staff', 'sales', 'tasks'], true)) {
                $query = $this->scopeToUserBranch($query);
            }

            $tabs[$module] = $query
                ->get()
                ->map(fn (Model $record) => $this->presentArchived($module, $record))
                ->values();
        }

        return Inertia::render('Archived/Index', [
            'archivedRecords' => $tabs,
        ]);
    }

    public function archive(string $module, int $id): RedirectResponse
    {
        $this->authorizeModule($module);
        $record = $this->resolveRecord($module, $id);
        $this->authorizeRecordBranchIfApplicable($module, $record);

        $record->status = 'archived';
        $record->archived_at = now();
        $record->save();

        return back()->with('success', 'Record archived successfully.');
    }

    public function restore(string $module, int $id): RedirectResponse
    {
        $this->authorizeModule($module);
        $record = $this->resolveRecord($module, $id, onlyArchived: true);
        $this->authorizeRecordBranchIfApplicable($module, $record);

        $record->status = self::MODULE_MAP[$module]['activeStatus'];
        $record->archived_at = null;
        $record->save();

        return back()->with('success', 'Record restored successfully.');
    }

    public function destroy(string $module, int $id): RedirectResponse
    {
        $this->authorizeModule($module);
        $record = $this->resolveRecord($module, $id, onlyArchived: true);
        $this->authorizeRecordBranchIfApplicable($module, $record);
        $record->delete();

        return back()->with('success', 'Record deleted successfully.');
    }

    private function resolveRecord(
        string $module,
        int $id,
        bool $onlyArchived = false
    ): Model {
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

    private function authorizeRecordBranchIfApplicable(
        string $module,
        Model $record
    ): void {
        if ($module === 'branches') {
            abort_unless(
                Auth::user()->isOwner(),
                403,
                'You do not have access to manage branches.'
            );

            return;
        }

        if ($module === 'staff') {
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
                'branch_name' => $record->branch?->name
                    ? str_replace('Mabi Sip and Bites ', '', $record->branch->name)
                    : '',
                'stock' => (float) $record->stock,
                'unit' => $record->unit,
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
                'branch_name' => $record->branch?->name
                    ? str_replace('Mabi Sip and Bites ', '', $record->branch->name)
                    : '',
                'total_amount' => (float) $record->total_amount,
            ],
            'tasks' => [
                'id' => $record->id,
                'title' => $record->title,
                'branch_name' => $record->branch?->name
                    ? str_replace('Mabi Sip and Bites ', '', $record->branch->name)
                    : '',
                'assigned_to_name' => $record->assignee?->name ?? '',
            ],
            default => ['id' => $record->id],
        };
    }
}
