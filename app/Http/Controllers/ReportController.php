<?php

namespace App\Http\Controllers;

use App\Models\AttendanceLog;
use App\Models\Branch;
use App\Models\Product;
use App\Models\Sale;
use App\Traits\BranchScoped;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ReportController
 *
 * Was listed as a required page in 00_CLAUDE_PROJECT_INSTRUCTIONS.md and
 * linked from the sidebar since Phase 4, but never actually built in any
 * prior phase — clicking "Reports" has 404'd this whole time.
 *
 * Scoped deliberately simple: a date-range + branch filter over sales,
 * inventory, and attendance, with totals/counts — not a new analytics
 * engine. 00_CLAUDE_PROJECT_INSTRUCTIONS.md explicitly excludes "advanced
 * analytics or machine learning" from this MVP, so this stays a filtered
 * summary view rather than trends, forecasts, or charts.
 */
class ReportController extends Controller
{
    use BranchScoped;

    public function index(Request $request): Response
    {
        $user = $request->user();
        $isOwner = $user->isOwner();

        $startDate = $request->query('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());
        $branchId = $request->query('branch_id');

        $branches = Branch::where('status', 'active')->get(['id', 'name']);

        $salesQuery = $this->scopeToUserBranch(
            Sale::query()->where('status', 'completed')
        )->whereBetween('sale_date', ["{$startDate} 00:00:00", "{$endDate} 23:59:59"]);

        if ($branchId && ($isOwner || (int) $branchId === $user->branch_id)) {
            $salesQuery->where('branch_id', $branchId);
        }

        $salesSummary = [
            'totalRevenue' => (float) $salesQuery->clone()->sum('total_amount'),
            'totalTransactions' => $salesQuery->clone()->count(),
            'averageSale' => (float) ($salesQuery->clone()->avg('total_amount') ?? 0),
            'byPaymentMethod' => $salesQuery->clone()
                ->selectRaw('payment_method, count(*) as count, sum(total_amount) as total')
                ->groupBy('payment_method')
                ->get()
                ->map(fn ($row) => [
                    'method' => $row->payment_method,
                    'count' => $row->count,
                    'total' => (float) $row->total,
                ]),
        ];

        $productQuery = $this->scopeToUserBranch(Product::query()->where('status', 'active'));
        if ($branchId && ($isOwner || (int) $branchId === $user->branch_id)) {
            $productQuery->where('branch_id', $branchId);
        }

        $inventorySnapshot = [
            'totalProducts' => $productQuery->clone()->count(),
            'totalStockValue' => (float) $productQuery->clone()->selectRaw('SUM(stock * selling_price) as total')->value('total') ?? 0,
            'lowStockCount' => $productQuery->clone()->whereColumn('stock', '<=', 'low_stock_threshold')->count(),
        ];

        $attendanceQuery = $this->scopeToUserBranch(AttendanceLog::query())
            ->whereBetween('work_date', [$startDate, $endDate]);
        if ($branchId && ($isOwner || (int) $branchId === $user->branch_id)) {
            $attendanceQuery->where('branch_id', $branchId);
        }

        $attendanceSummary = [
            'totalLogs' => $attendanceQuery->clone()->count(),
            'present' => $attendanceQuery->clone()->where('status', 'present')->count(),
            'late' => $attendanceQuery->clone()->where('status', 'late')->count(),
            'absent' => $attendanceQuery->clone()->where('status', 'absent')->count(),
        ];

        return Inertia::render('Reports/Index', [
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'branch_id' => $branchId,
            ],
            'branches' => $isOwner ? $branches : $branches->where('id', $user->branch_id)->values(),
            'salesSummary' => $salesSummary,
            'inventorySnapshot' => $inventorySnapshot,
            'attendanceSummary' => $attendanceSummary,
        ]);
    }
}
