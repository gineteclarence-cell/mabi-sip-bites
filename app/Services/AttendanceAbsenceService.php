<?php

namespace App\Services;

use App\Models\AttendanceLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AttendanceAbsenceService
{
    public function markDate(Carbon $date): int
    {
        $day = $date->copy()->startOfDay();
        $today = now()->startOfDay();
        if ($day->greaterThan($today) || ($day->equalTo($today) && now()->format('H:i:s') < '22:00:00')) {
            return 0;
        }

        $created = 0;
        $dayString = $day->toDateString();

        User::query()->where('role', 'staff')->where('status', 'active')
            ->whereNotNull('branch_id')->whereDate('created_at', '<=', $dayString)
            ->orderBy('id')->chunkById(100, function ($staffMembers) use ($dayString, &$created) {
                foreach ($staffMembers as $staff) {
                    DB::transaction(function () use ($staff, $dayString, &$created) {
                        // Compare by calendar day, not datetime formatting, across SQLite and MySQL.
                        // Also preserve any existing attendance record (present/late/absent).
                        $alreadyLogged = AttendanceLog::query()
                            ->where('user_id', $staff->id)
                            ->whereDate('work_date', $dayString)
                            ->exists();
                        if ($alreadyLogged) {
                            return;
                        }
                        AttendanceLog::create([
                            'user_id' => $staff->id,
                            'branch_id' => $staff->branch_id,
                            'work_date' => $dayString,
                            'time_in' => null,
                            'time_out' => null,
                            'status' => 'absent',
                            'remarks' => 'Automatically marked absent after 10:00 PM (no time-in).',
                        ]);
                        $created++;
                    });
                }
            });

        return $created;
    }
}
