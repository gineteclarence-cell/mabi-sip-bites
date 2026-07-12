<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\ArchiveController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\StaffTaskController;

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Reports + PDF export
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/export-pdf', [ReportController::class, 'exportPdf'])->name('reports.export-pdf');

    // POS ordering screen (same controller as Sales, different Inertia view)
    Route::get('/pos', [SaleController::class, 'pos'])->name('pos.index');

    // ── Owner-only ─────────────────────────────────────────────────────────
    Route::middleware('role:owner')->group(function () {
        Route::resource('branches', BranchController::class)
            ->except(['show', 'destroy', 'create', 'edit']);
    });

    // ── Owner + Manager ────────────────────────────────────────────────────
    Route::middleware('role:owner,manager')->group(function () {
        Route::resource('staff', StaffController::class)
            ->except(['show', 'destroy', 'create', 'edit']);
    });

    // ── All authenticated roles (branch-scoped inside each controller) ─────
    Route::resource('inventory', ProductController::class)
        ->except(['show', 'destroy', 'create', 'edit']);

    Route::resource('sales', SaleController::class)
        ->except(['show', 'destroy', 'create', 'edit', 'update']);

    Route::resource('attendance', AttendanceController::class)
        ->except(['show', 'destroy', 'create', 'edit']);

    Route::resource('tasks', StaffTaskController::class)
        ->except(['show', 'destroy', 'create', 'edit']);

    // ── Archive / Restore / Delete (generic, module-parameterised) ─────────
    Route::patch('/archive/{module}/{id}', [ArchiveController::class, 'archive'])
        ->name('archive.archive');
    Route::patch('/restore/{module}/{id}', [ArchiveController::class, 'restore'])
        ->name('archive.restore');
    Route::delete('/archive/{module}/{id}', [ArchiveController::class, 'destroy'])
        ->name('archive.destroy');
    Route::get('/archived-records', [ArchiveController::class, 'index'])
        ->name('archive.index');
});

require __DIR__.'/auth.php';
