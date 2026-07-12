<?php

namespace App\Http\Controllers;

use App\Models\AttendanceLog;
use App\Models\Branch;
use App\Models\Product;
use App\Models\Sale;
use App\Traits\BranchScoped;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    use BranchScoped;

    public function index(Request $request): Response
    {
        $user = $request->user();
        $isOwner = $user->isOwner();

        [$startDate, $endDate, $branchId] = $this->parseFilters($request);
        $branches = $this->getBranches($user, $isOwner);

        return Inertia::render('Reports/Index', [
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'branch_id' => $branchId,
            ],
            'branches' => $branches,
            'salesSummary' => $this->buildSalesSummary($startDate, $endDate, $branchId, $user, $isOwner),
            'inventorySnapshot' => $this->buildInventorySnapshot($branchId, $user, $isOwner),
            'attendanceSummary' => $this->buildAttendanceSummary($startDate, $endDate, $branchId, $user, $isOwner),
        ]);
    }

    public function exportPdf(Request $request): HttpResponse
    {
        $user = $request->user();
        $isOwner = $user->isOwner();

        [$startDate, $endDate, $branchId] = $this->parseFilters($request);
        $branches = $this->getBranches($user, $isOwner);

        $selectedBranch = $branchId
            ? $branches->firstWhere('id', (int) $branchId)
            : null;

        $data = [
            'generatedAt' => now()->format('F d, Y h:i A'),
            'startDate' => $startDate,
            'endDate' => $endDate,
            'branchLabel' => $selectedBranch
                ? $selectedBranch->name
                : 'All branches',
            'salesSummary' => $this->buildSalesSummary($startDate, $endDate, $branchId, $user, $isOwner),
            'inventorySnapshot' => $this->buildInventorySnapshot($branchId, $user, $isOwner),
            'attendanceSummary' => $this->buildAttendanceSummary($startDate, $endDate, $branchId, $user, $isOwner),
        ];

        $pdf = Pdf::loadView('reports.pdf', $data)
            ->setPaper('a4', 'portrait');

        $filename = 'mabi-report-' . $startDate . '-to-' . $endDate . '.pdf';

        return $pdf->download($filename);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private function parseFilters(Request $request): array
    {
        return [
            $request->query('start_date', now()->startOfMonth()->toDateString()),
            $request->query('end_date', now()->toDateString()),
            $request->query('branch_id'),
        ];
    }

    private function getBranches($user, bool $isOwner)
    {
        $all = Branch::where('status', 'active')->get(['id', 'name']);

        return $isOwner ? $all : $all->where('id', $user->branch_id)->values();
    }

    private function buildSalesSummary(string $startDate, string $endDate, ?string $branchId, $user, bool $isOwner): array
    {
        $q = $this->scopeToUserBranch(Sale::query()->where('status', 'completed'))
            ->whereBetween('sale_date', ["{$startDate} 00:00:00", "{$endDate} 23:59:59"]);

        if ($branchId && ($isOwner || (int) $branchId === $user->branch_id)) {
            $q->where('branch_id', $branchId);
        }

        return [
            'totalRevenue' => (float) $q->clone()->sum('total_amount'),
            'totalTransactions' => $q->clone()->count(),
            'averageSale' => (float) ($q->clone()->avg('total_amount') ?? 0),
            'byPaymentMethod' => $q->clone()
                ->selectRaw('payment_method, count(*) as count, sum(total_amount) as total')
                ->groupBy('payment_method')
                ->get()
                ->map(fn ($row) => [
                    'method' => $row->payment_method,
                    'count' => $row->count,
                    'total' => (float) $row->total,
                ])
                ->all(),
        ];
    }

    private function buildInventorySnapshot(?string $branchId, $user, bool $isOwner): array
    {
        $q = $this->scopeToUserBranch(Product::query()->where('status', 'active'));

        if ($branchId && ($isOwner || (int) $branchId === $user->branch_id)) {
            $q->where('branch_id', $branchId);
        }

        return [
            'totalProducts' => $q->clone()->count(),
            'totalStockValue' => (float) ($q->clone()->selectRaw('SUM(stock * selling_price) as total')->value('total') ?? 0),
            'lowStockCount' => $q->clone()->whereColumn('stock', '<=', 'low_stock_threshold')->count(),
        ];
    }

    private function buildAttendanceSummary(string $startDate, string $endDate, ?string $branchId, $user, bool $isOwner): array
    {
        $q = $this->scopeToUserBranch(AttendanceLog::query())
            ->whereBetween('work_date', [$startDate, $endDate]);

        if ($branchId && ($isOwner || (int) $branchId === $user->branch_id)) {
            $q->where('branch_id', $branchId);
        }

        return [
            'totalLogs' => $q->clone()->count(),
            'present' => $q->clone()->where('status', 'present')->count(),
            'late' => $q->clone()->where('status', 'late')->count(),
            'absent' => $q->clone()->where('status', 'absent')->count(),
        ];
    }
}
