<?php
namespace App\Console\Commands;
use App\Services\AttendanceAbsenceService;
use Carbon\Carbon;
use Illuminate\Console\Command;
class MarkAttendanceAbsences extends Command {
    protected $signature = 'attendance:mark-absent {date? : YYYY-MM-DD; defaults to yesterday}';
    protected $description = 'Create missing attendance rows after the workday closes';
    public function handle(AttendanceAbsenceService $service): int {
        $date = $this->argument('date') ? Carbon::createFromFormat('Y-m-d', $this->argument('date'))->startOfDay() : now()->subDay()->startOfDay();
        $count = $service->markDate($date);
        $this->info("Created {$count} absent logs for {$date->toDateString()}.");
        return self::SUCCESS;
    }
}
