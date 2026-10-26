<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_sessions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('attendance_log_id')
                ->constrained('attendance_logs')
                ->cascadeOnDelete();

            $table->dateTime('time_in');

            $table->dateTime('time_out')
                ->nullable();

            $table->timestamps();

            $table->index([
                'attendance_log_id',
                'time_in',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_sessions');
    }
};