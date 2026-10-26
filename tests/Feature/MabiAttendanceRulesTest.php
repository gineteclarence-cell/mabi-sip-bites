<?php
namespace Tests\Feature;

use App\Models\{AttendanceLog, AttendanceSession, Branch, User};
use App\Services\AttendanceHours;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MabiAttendanceRulesTest extends TestCase
{
    use RefreshDatabase;

    private function staff(): User
    {
        $branch = Branch::create(['name' => 'Test Shop', 'status' => 'active']);
        return User::factory()->staff()->create(['branch_id' => $branch->id]);
    }

    public function test_time_in_before_shop_open_is_rejected(): void
    {
        Carbon::setTestNow('2026-10-26 08:59:00');
        try {
            $this->actingAs($this->staff())->post(route('attendance.time-in'))->assertSessionHasErrors('attendance');
            $this->assertDatabaseCount('attendance_logs', 0);
        } finally { Carbon::setTestNow(); }
    }

    public function test_lunch_is_excluded_only_once_even_when_employee_clocks_out(): void
    {
        $staff = $this->staff();
        $log = AttendanceLog::create(['user_id' => $staff->id, 'branch_id' => $staff->branch_id,
            'work_date' => '2026-10-26', 'status' => 'present']);
        $log->sessions()->create(['time_in' => '2026-10-26 09:00:00', 'time_out' => '2026-10-26 12:00:00']);
        $log->sessions()->create(['time_in' => '2026-10-26 13:00:00', 'time_out' => '2026-10-26 22:00:00']);
        $this->assertSame(720, AttendanceHours::workedMinutes($log->sessions()->get()));
    }

    public function test_unpunched_lunch_is_excluded_from_a_continuous_shift(): void
    {
        $staff = $this->staff();
        $log = AttendanceLog::create(['user_id' => $staff->id, 'branch_id' => $staff->branch_id,
            'work_date' => '2026-10-26', 'status' => 'present']);
        $log->sessions()->create(['time_in' => '2026-10-26 09:00:00', 'time_out' => '2026-10-26 22:00:00']);
        $this->assertSame(720, AttendanceHours::workedMinutes($log->sessions()->get()));
    }

    public function test_absence_generation_is_idempotent(): void
    {
        Carbon::setTestNow('2026-10-26 23:00:00');
        try {
            $staff = $this->staff();
            $this->artisan('attendance:mark-absent', ['date'=>'2026-10-26'])->assertSuccessful();
            $firstPassCount = AttendanceLog::query()->count();
            $this->artisan('attendance:mark-absent', ['date'=>'2026-10-26'])->assertSuccessful();
            $this->assertSame($firstPassCount, AttendanceLog::query()->count(), 'Repeated absence marking must not add more attendance rows.');
            $this->assertSame(1, AttendanceLog::query()->where('user_id', $staff->id)->whereDate('work_date', '2026-10-26')->count());
            $this->assertDatabaseHas('attendance_logs', ['user_id' => $staff->id, 'status' => 'absent']);
        } finally { Carbon::setTestNow(); }
    }
}
