<?php

namespace App\Http\Controllers;

use App\Models\AttendanceLog;
use App\Models\AttendanceSession;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    public function index(Request $request): Response
    {
        app(\App\Services\AttendanceAbsenceService::class)->markDate(now()->subDay());
        $user = $request->user();

        $selectedBranchId = null;

        $query = AttendanceLog::query()
            ->with([
                'user',
                'branch',
                'sessions',
            ]);

        /*
        |--------------------------------------------------------------------------
        | STAFF
        |--------------------------------------------------------------------------
        |
        | Staff only sees their own attendance.
        |
        */

        if ($user->isStaff()) {
            $selectedBranchId =
                $user->branch_id;

            $query
                ->where(
                    'user_id',
                    $user->id
                )
                ->where(
                    'branch_id',
                    $user->branch_id
                );
        }

        /*
        |--------------------------------------------------------------------------
        | OWNER
        |--------------------------------------------------------------------------
        |
        | All branches:
        | /attendance
        |
        | Branch 1:
        | /attendance?branch_id=1
        |
        */

        elseif ($user->isOwner()) {
            $branchId =
                $request->integer(
                    'branch_id'
                );

            if ($branchId) {
                $validBranch =
                    Branch::query()
                        ->whereKey(
                            $branchId
                        )
                        ->where(
                            'status',
                            'active'
                        )
                        ->exists();

                if ($validBranch) {
                    $selectedBranchId =
                        $branchId;

                    $query->where(
                        'branch_id',
                        $branchId
                    );
                }
            }
        }

        /*
        |--------------------------------------------------------------------------
        | MANAGER
        |--------------------------------------------------------------------------
        |
        | Manager is permanently limited to assigned branch.
        |
        */

        else {
            $selectedBranchId =
                $user->branch_id;

            $query->where(
                'branch_id',
                $user->branch_id
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Staff filter for Owner / Manager
        |--------------------------------------------------------------------------
        */

        $staffQuery = User::query()
            ->where(
                'status',
                'active'
            )
            ->where(
                'role',
                'staff'
            );

        if ($user->isOwner()) {
            if ($selectedBranchId) {
                $staffQuery->where(
                    'branch_id',
                    $selectedBranchId
                );
            }
        } else {
            $staffQuery->where(
                'branch_id',
                $user->branch_id
            );
        }

        $staffOptions = $user->isStaff()
            ? collect()
            : $staffQuery
                ->orderBy('name')
                ->get([
                    'id',
                    'name',
                    'branch_id',
                ]);

        $selectedStaffId =
            $request->integer(
                'staff_id'
            ) ?: null;

        if (
            $selectedStaffId &&
            ! $user->isStaff()
        ) {
            $allowed =
                $staffOptions->contains(
                    'id',
                    $selectedStaffId
                );

            abort_unless(
                $allowed,
                403,
                'You do not have access to that staff member.'
            );

            $query->where(
                'user_id',
                $selectedStaffId
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Logs
        |--------------------------------------------------------------------------
        */

        $logs = $query
            ->orderByDesc(
                'work_date'
            )
            ->orderByDesc('id')
            ->get()
            ->map(
                fn (AttendanceLog $log) =>
                    $this->presentLog(
                        $log
                    )
            )
            ->values();

        /*
        |--------------------------------------------------------------------------
        | Today's current attendance for logged-in Staff
        |--------------------------------------------------------------------------
        */

        $todayAttendance = null;

        if ($user->isStaff()) {
            $today = AttendanceLog::query()
                ->where(
                    'user_id',
                    $user->id
                )
                ->where(
                    'work_date',
                    now()->toDateString()
                )
                ->with('sessions')
                ->first();

            if ($today) {
                $todayAttendance =
                    $this->presentLog(
                        $today
                    );
            }
        }

        return Inertia::render(
            'Attendance/Index',
            [
                'attendanceLogs' =>
                    $logs,

                'staffOptions' =>
                    $staffOptions,

                'todayAttendance' =>
                    $todayAttendance,

                'selectedBranchId' =>
                    $selectedBranchId,

                'filters' => [
                    'staff_id' =>
                        $selectedStaffId,
                ],

                'permissions' => [
                    'is_owner' =>
                        $user->isOwner(),

                    'is_manager' =>
                        $user->isManager(),

                    'is_staff' =>
                        $user->isStaff(),

                    /*
                     * Only staff records their own real-time attendance.
                     */
                    'can_clock' =>
                        $user->isStaff(),
                ],
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | TIME IN
    |--------------------------------------------------------------------------
    */

    public function timeIn(
        Request $request
    ): RedirectResponse {
        $user =
            $request->user();

        abort_unless(
            $user->isStaff(),
            403,
            'Only staff accounts can time in.'
        );

        if (! $user->branch_id) {
            throw ValidationException::withMessages([
                'attendance' =>
                    'Your account is not assigned to a branch.',
            ]);
        }

        if (now()->format('H:i:s') < '09:00:00' || now()->format('H:i:s') >= '22:00:00') {
            throw ValidationException::withMessages(['attendance' => 'Time-in is allowed only from 9:00 AM to 10:00 PM.']);
        }

        $today =
            now()->toDateString();

        /*
        |--------------------------------------------------------------------------
        | Create/retrieve today's daily attendance
        |--------------------------------------------------------------------------
        */

        $attendance =
            AttendanceLog::firstOrCreate(
                [
                    'user_id' =>
                        $user->id,

                    'work_date' =>
                        $today,
                ],
                [
                    'branch_id' =>
                        $user->branch_id,

                    /*
                     * These legacy columns are retained for compatibility.
                     * First clock-in becomes time_in.
                     */
                    'time_in' =>
                        now(),

                    'time_out' =>
                        null,

                    'status' =>
                        now()->format('H:i:s') > '09:15:00' ? 'late' : 'present',

                    'remarks' =>
                        null,
                ]
            );

        /*
        |--------------------------------------------------------------------------
        | Make sure the attendance still belongs to today's branch
        |--------------------------------------------------------------------------
        */

        abort_unless(
            (int) $attendance->branch_id ===
                (int) $user->branch_id,
            403
        );

        /*
        |--------------------------------------------------------------------------
        | Cannot Time In twice without Time Out
        |--------------------------------------------------------------------------
        */

        $openSession =
            $attendance->sessions()
                ->whereNull(
                    'time_out'
                )
                ->latest(
                    'time_in'
                )
                ->first();

        if ($openSession) {
            throw ValidationException::withMessages([
                'attendance' =>
                    'You are already timed in. Time out first before starting another session.',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Real server time
        |--------------------------------------------------------------------------
        */

        $session =
            $attendance
                ->sessions()
                ->create([
                    'time_in' =>
                        now(),
                ]);

        /*
        |--------------------------------------------------------------------------
        | Keep legacy first time-in value
        |--------------------------------------------------------------------------
        */

        if (
            ! $attendance->time_in
        ) {
            $attendance->update([
                'time_in' =>
                    $session->time_in,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Automatic status
        |--------------------------------------------------------------------------
        |
        | No editable status.
        |
        */

        // Preserve the daily first-in classification across break sessions.
        $attendance->update([
            'status' => $attendance->time_in?->format('H:i:s') > '09:15:00' ? 'late' : 'present',
        ]);

        return back()->with(
            'success',
            'Time in recorded successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | TIME OUT
    |--------------------------------------------------------------------------
    */

    public function timeOut(
        Request $request
    ): RedirectResponse {
        $user =
            $request->user();

        abort_unless(
            $user->isStaff(),
            403,
            'Only staff accounts can time out.'
        );

        $attendance =
            AttendanceLog::query()
                ->where(
                    'user_id',
                    $user->id
                )
                ->where(
                    'work_date',
                    now()->toDateString()
                )
                ->with('sessions')
                ->first();

        if (! $attendance) {
            throw ValidationException::withMessages([
                'attendance' =>
                    'You must time in before timing out.',
            ]);
        }

        $session =
            $attendance->sessions()
                ->whereNull(
                    'time_out'
                )
                ->latest(
                    'time_in'
                )
                ->first();

        if (! $session) {
            throw ValidationException::withMessages([
                'attendance' =>
                    'There is no active attendance session to time out.',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Real server time
        |--------------------------------------------------------------------------
        */

        $session->update([
            'time_out' =>
                now(),
        ]);

        /*
         * Legacy daily time_out always contains the latest clock-out.
         */
        $attendance->update([
            'time_out' =>
                $session->time_out,

            'status' => $attendance->time_in?->format('H:i:s') > '09:15:00' ? 'late' : 'present',
        ]);

        return back()->with(
            'success',
            'Time out recorded successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | PRESENTATION
    |--------------------------------------------------------------------------
    */

    private function presentLog(
        AttendanceLog $log
    ): array {
        $sessions =
            $log->sessions
                ->map(
                    function (
                        AttendanceSession $session
                    ) {
                        return [
                            'id' =>
                                $session->id,

                            'time_in' =>
                                $session
                                    ->time_in
                                    ?->format(
                                        'H:i'
                                    ),

                            'time_out' =>
                                $session
                                    ->time_out
                                    ?->format(
                                        'H:i'
                                    ),

                            'time_in_label' =>
                                $session
                                    ->time_in
                                    ?->format(
                                        'h:i A'
                                    ),

                            'time_out_label' =>
                                $session
                                    ->time_out
                                    ?->format(
                                        'h:i A'
                                    ),
                        ];
                    }
                )
                ->values();

        $activeSession =
            $log->sessions
                ->first(
                    fn (
                        AttendanceSession $session
                    ) =>
                        $session->time_out ===
                        null
                );

        /*
        |--------------------------------------------------------------------------
        | Calculate total worked minutes
        |--------------------------------------------------------------------------
        */

        $workedMinutes = (int) \App\Services\AttendanceHours::workedMinutes($log->sessions);

        $hours =
            intdiv(
                $workedMinutes,
                60
            );

        $minutes =
            $workedMinutes %
            60;

        /*
         * Records from previous dates are always read-only.
         */
        $isToday =
            $log
                ->work_date
                ?->isToday() ??
            false;

        return [
            'id' =>
                $log->id,

            'user_id' =>
                $log->user_id,

            'staff_name' =>
                $log->user?->name ??
                '',

            'branch_id' =>
                $log->branch_id,

            'branch_name' =>
                $log->branch?->name
                    ? str_replace(
                        'Mabi Sip and Bites ',
                        '',
                        $log
                            ->branch
                            ->name
                    )
                    : '',

            'work_date' =>
                $log
                    ->work_date
                    ?->toDateString(),

            /*
             * First time-in.
             */
            'time_in' =>
                $log->sessions
                    ->first()
                    ?->time_in
                    ?->format(
                        'H:i'
                    ),

            /*
             * Latest time-out.
             */
            'time_out' =>
                $log->sessions
                    ->last()
                    ?->time_out
                    ?->format(
                        'H:i'
                    ),

            /*
             * Status is generated by system.
             */
            'status' =>
                $this->automaticStatus(
                    $log
                ),

            'sessions' =>
                $sessions,

            'session_count' =>
                $sessions->count(),

            'is_clocked_in' =>
                $activeSession !==
                null,

            'is_today' =>
                $isToday,

            'can_modify' =>
                $isToday,

            'worked_minutes' =>
                $workedMinutes,

            'worked_time' =>
                sprintf(
                    '%dh %02dm',
                    $hours,
                    $minutes
                ),

            'remarks' =>
                $log->remarks,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | AUTOMATIC STATUS
    |--------------------------------------------------------------------------
    |
    | No "Incomplete".
    |
    | Existing attendance = Present.
    |
    | Later, if you add a shifts/schedules table, this method is exactly
    | where Late / Absent can be calculated from each staff shift.
    |
    */

    private function automaticStatus(
        AttendanceLog $log
    ): string {
        if ($log->sessions->isEmpty() && ! $log->time_in) return 'absent';
        return $log->time_in?->format('H:i:s') > '09:15:00' ? 'late' : 'present';
    }
}