<?php
namespace App\Services;
use Carbon\Carbon;
use Illuminate\Support\Collection;
class AttendanceHours {
    public static function workedMinutes(Collection $sessions): int {
        $minutes = 0;
        foreach ($sessions as $session) {
            if (! $session->time_in || ! $session->time_out) continue;
            $start = $session->time_in;
            $end = $session->time_out;
            $gross = max(0, (int) $start->diffInMinutes($end, false));
            // Overlap of worked session with 12:00–13:00 is unpaid break.
            // Time-out/time-in events remain stored unchanged as proof of activity.
            $lunchStart = $start->copy()->startOfDay()->addHours(12);
            $lunchEnd = $lunchStart->copy()->addHour();
            $overlapStart = $start->greaterThan($lunchStart) ? $start : $lunchStart;
            $overlapEnd = $end->lessThan($lunchEnd) ? $end : $lunchEnd;
            $break = $overlapEnd->greaterThan($overlapStart) ? (int) $overlapStart->diffInMinutes($overlapEnd) : 0;
            $minutes += max(0, $gross - $break);
        }
        return $minutes;
    }
}
