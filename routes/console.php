<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// On production run `php artisan schedule:run` from cron every minute.
\Illuminate\Support\Facades\Schedule::command('attendance:mark-absent')->dailyAt('00:05')->timezone(config('app.timezone'));
