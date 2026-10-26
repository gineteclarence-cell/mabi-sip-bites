<?php

use App\Http\Controllers\ArchiveController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\StaffTaskController;
use App\Http\Controllers\CategoryController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => auth()->check()
    ? redirect()->route('dashboard')
    : redirect()->route('login'));

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/reports', [ReportController::class, 'index'])
    ->name('reports.index');

    Route::get('/reports/sales/pdf', [ReportController::class, 'exportSalesPdf'])
        ->name('reports.sales-pdf');

    Route::get('/reports/inventory/pdf', [ReportController::class, 'exportInventoryPdf'])
        ->name('reports.inventory-pdf');

    Route::get('/reports/attendance/pdf', [ReportController::class, 'exportAttendancePdf'])
        ->name('reports.attendance-pdf');

    Route::get('/pos', [SaleController::class, 'pos'])->name('pos.index');

    Route::get('/sales/{sale}/receipt-pdf', [SaleController::class, 'receiptPdf'])
        ->name('sales.receipt.pdf');

    Route::get('/categories/{category}/image', [CategoryController::class, 'image'])->name('categories.image');

    Route::post(
        '/categories',
        [CategoryController::class, 'store']
    )->name('categories.store');

    Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

    Route::put(
        '/categories/{category}',
        [CategoryController::class, 'update']
    )->name('categories.update');

    Route::middleware('role:owner')->group(function () {
        Route::resource('branches', BranchController::class)
            ->except(['show', 'destroy', 'create', 'edit']);
    });

    Route::middleware('role:owner,manager')->group(function () {
        Route::resource('staff', StaffController::class)
            ->except(['show', 'destroy', 'create', 'edit']);
    });

    Route::resource('inventory', ProductController::class)
    ->except(['show', 'destroy', 'create', 'edit']);

    Route::patch('/inventory/{ingredient}/add-stock', [ProductController::class, 'addStock'])
        ->name('inventory.add-stock');

    Route::resource('sales', SaleController::class)
        ->except(['show', 'destroy', 'create', 'edit', 'update']);

    Route::resource('tasks', StaffTaskController::class)
        ->except(['show', 'destroy', 'create', 'edit']);

    Route::get('/attendance', [AttendanceController::class, 'index'])
    ->name('attendance.index');

    Route::middleware('role:staff')->group(function () {
        Route::post('/attendance/time-in', [AttendanceController::class, 'timeIn'])
            ->name('attendance.time-in');

        Route::post('/attendance/time-out', [AttendanceController::class, 'timeOut'])
            ->name('attendance.time-out');
    });

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