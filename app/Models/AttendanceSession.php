<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceSession extends Model
{
    protected $fillable = [
        'attendance_log_id',
        'time_in',
        'time_out',
    ];

    protected function casts(): array
    {
        return [
            'time_in' => 'datetime',
            'time_out' => 'datetime',
        ];
    }

    public function attendanceLog(): BelongsTo
    {
        return $this->belongsTo(
            AttendanceLog::class
        );
    }
}