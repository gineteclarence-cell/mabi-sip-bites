<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAttendanceRequest;
use App\Models\AttendanceLog;
use App\Traits\BranchScoped;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    use BranchScoped;

    public function index(): Response
    {
        $logs = $this->scopeToUserBranch(
            AttendanceLog::query()->with(['user', 'branch'])
        )
            ->orderByDesc('work_date')
            ->get()
            ->map(fn (AttendanceLog $log) => $this->presentLog($log));

        $staffOptions = $this->scopeToUserBranch(
            \App\Models\User::query()->where('status', 'active')
        )->get(['id', 'name', 'branch_id']);

        return Inertia::render('Attendance/Index', [
            'attendanceLogs' => $logs,
            'staffOptions' => $staffOptions,
        ]);
    }

    public function store(StoreAttendanceRequest $request): RedirectResponse
    {
        $this->authorizeBranch((int) $request->validated('branch_id'));

        // Per 07_BACKEND_CONTROLLERS_AND_ROUTES.md "Attendance Behavior":
        // prevent duplicate time-in for the same staff/date unless the
        // existing log is incomplete and is the one being completed now.
        $existing = AttendanceLog::where('user_id', $request->validated('user_id'))
            ->where('work_date', $request->validated('work_date'))
            ->first();

        if ($existing) {
            throw ValidationException::withMessages([
                'work_date' => 'This staff member already has an attendance log for this date.',
            ]);
        }

        AttendanceLog::create($request->validated());

        return redirect()->back()->with('success', 'Attendance log created successfully.');
    }

    public function update(StoreAttendanceRequest $request, AttendanceLog $attendance): RedirectResponse
    {
        $this->authorizeRecordBranch($attendance);
        $this->authorizeBranch((int) $request->validated('branch_id'));

        $attendance->update($request->validated());

        return redirect()->back()->with('success', 'Attendance log updated successfully.');
    }

    private function presentLog(AttendanceLog $log): array
    {
        return [
            'id' => $log->id,
            'user_id' => $log->user_id,
            'staff_name' => $log->user?->name ?? '',
            'branch_id' => $log->branch_id,
            'branch_name' => $log->branch?->name ? str_replace('Mabi Sip and Bites ', '', $log->branch->name) : '',
            'work_date' => $log->work_date?->toDateString(),
            'time_in' => $log->time_in?->toIso8601String(),
            'time_out' => $log->time_out?->toIso8601String(),
            'status' => $log->status,
            'remarks' => $log->remarks,
        ];
    }
}
