<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStaffTaskRequest;
use App\Models\StaffTask;
use App\Traits\BranchScoped;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class StaffTaskController extends Controller
{
    use BranchScoped;

    public function index(): Response
    {
        $tasks = $this->scopeToUserBranch(
            StaffTask::query()->where('status', '!=', 'archived')->with(['branch', 'assignee', 'assigner'])
        )
            ->orderBy('due_date')
            ->get()
            ->map(fn (StaffTask $task) => $this->presentTask($task));

        return Inertia::render('Tasks/Index', [
            'tasks' => $tasks,
        ]);
    }

    public function store(StoreStaffTaskRequest $request): RedirectResponse
    {
        $this->authorizeBranch((int) $request->validated('branch_id'));

        StaffTask::create([
            ...$request->validated(),
            'assigned_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', 'Task created successfully.');
    }

    public function update(StoreStaffTaskRequest $request, StaffTask $task): RedirectResponse
    {
        $this->authorizeRecordBranch($task);
        $this->authorizeBranch((int) $request->validated('branch_id'));

        $task->update($request->validated());

        return redirect()->back()->with('success', 'Task updated successfully.');
    }

    private function presentTask(StaffTask $task): array
    {
        return [
            'id' => $task->id,
            'branch_id' => $task->branch_id,
            'branch_name' => $task->branch?->name ? str_replace('Mabi Sip and Bites ', '', $task->branch->name) : '',
            'assigned_to' => $task->assigned_to,
            'assigned_to_name' => $task->assignee?->name ?? '',
            'assigned_by' => $task->assigned_by,
            'assigned_by_name' => $task->assigner?->name ?? '',
            'title' => $task->title,
            'description' => $task->description,
            'priority' => $task->priority,
            'status' => $task->status,
            'due_date' => $task->due_date?->toDateString(),
        ];
    }
}
