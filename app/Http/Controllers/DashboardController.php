<?php

namespace App\Http\Controllers;

use App\Models\AttendanceLog;
use App\Models\Branch;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StaffTask;
use App\Models\User;
use App\Traits\BranchScoped;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    use BranchScoped;

    /**
     * Shapes every section to match dashboardSampleData from Phase 5's
     * resources/js/lib/sampleData.js exactly — same keys, same nesting —
     * so Dashboard.jsx's `dashboardData ?? dashboardSampleData` fallback
     * can simply be deleted now that this controller exists.
     */
    public function index(): Response
    {
        $user = Auth::user();
        $isOwner = $user->isOwner();
        $branches = Branch::where('status', 'active')->get();

        return Inertia::render('Dashboard', [
            'dashboardData' => [
                'branches' => $branches->map(fn (Branch $b) => ['id' => $b->id, 'name' => str_replace('Mabi Sip and Bites ', '', $b->name)]),
                'kpis' => $this->buildKpis($branches, $isOwner, $user->branch_id),
                'branchComparison' => $this->buildBranchComparison($branches, $isOwner, $user->branch_id),
                'recentSales' => $this->buildRecentSales($isOwner, $user->branch_id),
                'lowStockProducts' => $this->buildLowStock($isOwner, $user->branch_id),
                'attendanceSummary' => $this->buildAttendanceSummary($isOwner, $user->branch_id),
                'pendingTasksList' => $this->buildPendingTasks($isOwner, $user->branch_id),
            ],
        ]);
    }

    private function buildKpis($branches, bool $isOwner, ?int $userBranchId): array
    {
        $todayStart = now()->startOfDay();
        $weekAgo = now()->subDays(7);

        $branchIds = $isOwner ? $branches->pluck('id') : collect([$userBranchId]);

        $totalRevenue = Sale::whereIn('branch_id', $branchIds)->where('status', 'completed')->sum('total_amount');
        $todaysSales = Sale::whereIn('branch_id', $branchIds)->where('status', 'completed')->where('sale_date', '>=', $todayStart)->sum('total_amount');
        $totalTransactions = Sale::whereIn('branch_id', $branchIds)->where('status', 'completed')->where('sale_date', '>=', $weekAgo)->count();
        $lowStockCount = Product::whereIn('branch_id', $branchIds)->where('status', 'active')->whereColumn('stock', '<=', 'low_stock_threshold')->count();
        $activeStaffCount = User::whereIn('branch_id', $branchIds)->where('status', 'active')->where('role', '!=', 'owner')->count();
        $presentToday = AttendanceLog::whereIn('branch_id', $branchIds)->where('work_date', now()->toDateString())->where('status', '!=', 'absent')->count();
        $pendingTasksCount = StaffTask::whereIn('branch_id', $branchIds)->whereIn('status', ['pending', 'in_progress'])->count();

        $revenueBreakdown = $branches->map(fn (Branch $b) => [
            'branchId' => $b->id,
            'branchName' => str_replace('Mabi Sip and Bites ', '', $b->name),
            'value' => (float) Sale::where('branch_id', $b->id)->where('status', 'completed')->sum('total_amount'),
        ]);

        return [
            'totalRevenue' => [
                'value' => (float) $totalRevenue,
                'format' => 'currency',
                'change' => ['direction' => 'up', 'label' => 'All time'],
                'breakdown' => $revenueBreakdown,
            ],
            'todaysSales' => [
                'value' => (float) $todaysSales,
                'format' => 'currency',
                'change' => ['direction' => 'up', 'label' => 'Today'],
                'breakdown' => $branches->map(fn (Branch $b) => [
                    'branchId' => $b->id,
                    'branchName' => str_replace('Mabi Sip and Bites ', '', $b->name),
                    'value' => (float) Sale::where('branch_id', $b->id)->where('status', 'completed')->where('sale_date', '>=', $todayStart)->sum('total_amount'),
                ]),
            ],
            'totalTransactions' => [
                'value' => $totalTransactions,
                'format' => 'number',
                'change' => ['direction' => 'up', 'label' => 'Last 7 days'],
                'breakdown' => $branches->map(fn (Branch $b) => [
                    'branchId' => $b->id,
                    'branchName' => str_replace('Mabi Sip and Bites ', '', $b->name),
                    'value' => Sale::where('branch_id', $b->id)->where('status', 'completed')->where('sale_date', '>=', $weekAgo)->count(),
                ]),
            ],
            'lowStockItems' => [
                'value' => $lowStockCount,
                'format' => 'number',
                'change' => ['direction' => $lowStockCount > 0 ? 'down' : 'up', 'label' => $lowStockCount > 0 ? 'Needs attention' : 'All stocked'],
                'breakdown' => $branches->map(fn (Branch $b) => [
                    'branchId' => $b->id,
                    'branchName' => str_replace('Mabi Sip and Bites ', '', $b->name),
                    'value' => Product::where('branch_id', $b->id)->where('status', 'active')->whereColumn('stock', '<=', 'low_stock_threshold')->count(),
                ]),
            ],
            'activeStaff' => [
                'value' => $activeStaffCount,
                'format' => 'number',
                'change' => ['direction' => 'up', 'label' => 'Currently active'],
                'breakdown' => $branches->map(fn (Branch $b) => [
                    'branchId' => $b->id,
                    'branchName' => str_replace('Mabi Sip and Bites ', '', $b->name),
                    'value' => User::where('branch_id', $b->id)->where('status', 'active')->where('role', '!=', 'owner')->count(),
                ]),
            ],
            'attendanceToday' => [
                'value' => "{$presentToday}/{$activeStaffCount}",
                'format' => 'text',
                'change' => ['direction' => 'up', 'label' => 'Present today'],
                'breakdown' => $branches->map(fn (Branch $b) => [
                    'branchId' => $b->id,
                    'branchName' => str_replace('Mabi Sip and Bites ', '', $b->name),
                    'value' => AttendanceLog::where('branch_id', $b->id)->where('work_date', now()->toDateString())->where('status', '!=', 'absent')->count() . '/' . User::where('branch_id', $b->id)->where('status', 'active')->where('role', '!=', 'owner')->count(),
                ]),
            ],
            'pendingTasks' => [
                'value' => $pendingTasksCount,
                'format' => 'number',
                'change' => ['direction' => 'down', 'label' => 'Open items'],
                'breakdown' => $branches->map(fn (Branch $b) => [
                    'branchId' => $b->id,
                    'branchName' => str_replace('Mabi Sip and Bites ', '', $b->name),
                    'value' => StaffTask::where('branch_id', $b->id)->whereIn('status', ['pending', 'in_progress'])->count(),
                ]),
            ],
            'branchGrowth' => [
                // MVP-level approximation: this week's revenue vs the prior
                // week, expressed as a percentage. Deliberately simple —
                // the scope/limitations section of 00_CLAUDE_PROJECT_INSTRUCTIONS.md
                // explicitly excludes "advanced analytics", so this stays
                // a straightforward week-over-week comparison rather than
                // a forecasting or trend-modeling feature.
                'value' => $this->formatGrowthPercentage($branchIds),
                'format' => 'text',
                'change' => ['direction' => 'up', 'label' => 'Week over week'],
                'breakdown' => $branches->map(fn (Branch $b) => [
                    'branchId' => $b->id,
                    'branchName' => str_replace('Mabi Sip and Bites ', '', $b->name),
                    'value' => $this->formatGrowthPercentage(collect([$b->id])),
                ]),
            ],
        ];
    }

    private function formatGrowthPercentage($branchIds): string
    {
        $thisWeek = Sale::whereIn('branch_id', $branchIds)->where('status', 'completed')->where('sale_date', '>=', now()->subDays(7))->sum('total_amount');
        $lastWeek = Sale::whereIn('branch_id', $branchIds)->where('status', 'completed')->whereBetween('sale_date', [now()->subDays(14), now()->subDays(7)])->sum('total_amount');

        if ($lastWeek == 0) {
            return $thisWeek > 0 ? '+100%' : '0%';
        }

        $percent = (($thisWeek - $lastWeek) / $lastWeek) * 100;

        return ($percent >= 0 ? '+' : '') . number_format($percent, 1) . '%';
    }

    private function buildBranchComparison($branches, bool $isOwner, ?int $userBranchId): array
    {
        $visibleBranches = $isOwner ? $branches : $branches->where('id', $userBranchId);

        return $visibleBranches->map(fn (Branch $b) => [
            'branchId' => $b->id,
            'branchName' => str_replace('Mabi Sip and Bites ', '', $b->name),
            'revenue' => (float) Sale::where('branch_id', $b->id)->where('status', 'completed')->sum('total_amount'),
            'transactions' => Sale::where('branch_id', $b->id)->where('status', 'completed')->count(),
            'staff' => User::where('branch_id', $b->id)->where('status', 'active')->where('role', '!=', 'owner')->count(),
        ])->values()->all();
    }

    private function buildRecentSales(bool $isOwner, ?int $userBranchId): array
    {
        return $this->scopeToUserBranch(Sale::query()->where('status', 'completed')->with(['branch', 'staff']))
            ->orderByDesc('sale_date')
            ->limit(5)
            ->get()
            ->map(fn (Sale $s) => [
                'id' => $s->id,
                'transactionNumber' => $s->transaction_number,
                'branchName' => $s->branch?->name ? str_replace('Mabi Sip and Bites ', '', $s->branch->name) : '',
                'staffName' => $s->staff?->name ?? '',
                'amount' => (float) $s->total_amount,
                'paymentMethod' => $s->payment_method,
                'saleDate' => $s->sale_date?->format('Y-m-d H:i'),
            ])->all();
    }

    private function buildLowStock(bool $isOwner, ?int $userBranchId): array
    {
        return $this->scopeToUserBranch(Product::query()->where('status', 'active')->whereColumn('stock', '<=', 'low_stock_threshold')->with('branch'))
            ->orderBy('stock')
            ->get()
            ->map(fn (Product $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'branchName' => $p->branch?->name ? str_replace('Mabi Sip and Bites ', '', $p->branch->name) : '',
                'stock' => $p->stock,
                'lowStockThreshold' => $p->low_stock_threshold,
            ])->all();
    }

    private function buildAttendanceSummary(bool $isOwner, ?int $userBranchId): array
    {
        return $this->scopeToUserBranch(AttendanceLog::query()->where('work_date', now()->toDateString())->with(['user', 'branch']))
            ->get()
            ->map(fn (AttendanceLog $log) => [
                'id' => $log->id,
                'staffName' => $log->user?->name ?? '',
                'branchName' => $log->branch?->name ? str_replace('Mabi Sip and Bites ', '', $log->branch->name) : '',
                'timeIn' => $log->time_in?->format('h:i A'),
                'timeOut' => $log->time_out?->format('h:i A'),
                'status' => $log->status,
            ])->all();
    }

    private function buildPendingTasks(bool $isOwner, ?int $userBranchId): array
    {
        return $this->scopeToUserBranch(StaffTask::query()->whereIn('status', ['pending', 'in_progress'])->with(['branch', 'assignee']))
            ->orderBy('due_date')
            ->limit(5)
            ->get()
            ->map(fn (StaffTask $t) => [
                'id' => $t->id,
                'title' => $t->title,
                'branchName' => $t->branch?->name ? str_replace('Mabi Sip and Bites ', '', $t->branch->name) : '',
                'assignedTo' => $t->assignee?->name ?? '',
                'priority' => $t->priority,
                'dueDate' => $t->due_date?->toDateString(),
            ])->all();
    }
}
