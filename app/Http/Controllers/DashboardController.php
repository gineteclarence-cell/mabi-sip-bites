<?php

namespace App\Http\Controllers;

use App\Models\AttendanceLog;
use App\Models\Branch;
use App\Models\Ingredient;
use App\Models\Sale;
use App\Models\StaffTask;
use App\Models\User;
use App\Traits\BranchScoped;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    use BranchScoped;

    /**
     * Dashboard data.
     *
     * Revenue-related dashboard values use the current calendar month.
     * Owner sees all active branches.
     * Manager/staff only see their assigned branch where applicable.
     */
    public function index(): Response
    {
        $user = Auth::user();
        $isOwner = $user->isOwner();

        $branches = Branch::where('status', 'active')->get();
        $selectedBranchId = $isOwner ? request()->integer('branch_id') : null;
        if ($selectedBranchId) $branches = $branches->where('id', $selectedBranchId)->values();
        $scopedOwner = $isOwner && ! $selectedBranchId;
        $branchId = $selectedBranchId ?: $user->branch_id;

        return Inertia::render('Dashboard', [
            'dashboardData' => [
                'branches' => $branches->map(fn (Branch $b) => [
                    'id' => $b->id,
                    'name' => $this->branchName($b),
                ]),

                'period' => [
                    'month' => now()->format('F'),
                    'year' => now()->year,
                    'label' => now()->format('F Y'),
                ],

                'kpis' => $this->buildKpis(
                    $branches,
                    $scopedOwner,
                    $branchId
                ),

                'branchComparison' => $this->buildBranchComparison(
                    $branches,
                    $scopedOwner,
                    $branchId
                ),

                'recentSales' => $this->buildRecentSales(
                    $scopedOwner,
                    $branchId
                ),

                'lowStockProducts' => $this->buildLowStock(
                    $scopedOwner,
                    $branchId
                ),

                'attendanceSummary' => $this->buildAttendanceSummary(
                    $scopedOwner,
                    $branchId
                ),

                'pendingTasksList' => $this->buildPendingTasks(
                    $scopedOwner,
                    $branchId
                ),
            ],
        ]);
    }

    /**
     * Build dashboard KPI cards.
     */
    private function buildKpis(
        $branches,
        bool $isOwner,
        ?int $userBranchId
    ): array {
        $todayStart = now()->copy()->startOfDay();

        $weekAgo = now()->copy()->subDays(7);

        /*
        |--------------------------------------------------------------------------
        | Current month boundaries
        |--------------------------------------------------------------------------
        |
        | Automatically changes every month.
        |
        | Example:
        | September 1, 2026 00:00:00
        | September 30, 2026 23:59:59
        |
        */
        $monthStart = now()->copy()->startOfMonth();
        $monthEnd = now()->copy()->endOfMonth();

        $branchIds = $isOwner
            ? $branches->pluck('id')
            : collect([$userBranchId]);

        /*
        |--------------------------------------------------------------------------
        | Monthly revenue
        |--------------------------------------------------------------------------
        |
        | Previously this was ALL-TIME revenue.
        | It now only includes completed sales from the current month.
        |
        */
        $totalRevenue = Sale::whereIn('branch_id', $branchIds)
            ->where('status', 'completed')
            ->whereBetween('sale_date', [$monthStart, $monthEnd])
            ->sum('total_amount');

        /*
        |--------------------------------------------------------------------------
        | Today's sales
        |--------------------------------------------------------------------------
        */
        $todaysSales = Sale::whereIn('branch_id', $branchIds)
            ->where('status', 'completed')
            ->where('sale_date', '>=', $todayStart)
            ->sum('total_amount');

        /*
        |--------------------------------------------------------------------------
        | Transactions - last 7 days
        |--------------------------------------------------------------------------
        |
        | Keeping your existing logic unchanged.
        |
        */
        $totalTransactions = Sale::whereIn('branch_id', $branchIds)
            ->where('status', 'completed')
            ->where('sale_date', '>=', $weekAgo)
            ->count();

        /*
        |--------------------------------------------------------------------------
        | Low stock
        |--------------------------------------------------------------------------
        */
        $lowStockCount = Ingredient::whereIn('branch_id', $branchIds)
            ->where('status', 'active')
            ->whereColumn('stock', '<=', 'low_stock_threshold')
            ->count();

        /*
        |--------------------------------------------------------------------------
        | Active staff
        |--------------------------------------------------------------------------
        */
        $activeStaffCount = User::whereIn('branch_id', $branchIds)
            ->where('status', 'active')
            ->where('role', '!=', 'owner')
            ->count();

        /*
        |--------------------------------------------------------------------------
        | Attendance today
        |--------------------------------------------------------------------------
        */
        $presentToday = AttendanceLog::whereIn('branch_id', $branchIds)
            ->where('work_date', now()->toDateString())
            ->where('status', '!=', 'absent')
            ->count();

        /*
        |--------------------------------------------------------------------------
        | Pending tasks
        |--------------------------------------------------------------------------
        */
        $pendingTasksCount = StaffTask::whereIn('branch_id', $branchIds)
            ->whereIn('status', ['pending', 'in_progress'])
            ->count();

        /*
        |--------------------------------------------------------------------------
        | Visible branches for KPI modal breakdowns
        |--------------------------------------------------------------------------
        */
        $visibleBranches = $isOwner
            ? $branches
            : $branches->where('id', $userBranchId);

        /*
        |--------------------------------------------------------------------------
        | Monthly Revenue Breakdown
        |--------------------------------------------------------------------------
        |
        | This is what appears when the Monthly Revenue card is clicked.
        |
        */
        $revenueBreakdown = $visibleBranches
            ->map(fn (Branch $b) => [
                'branchId' => $b->id,

                'branchName' => $this->branchName($b),

                'value' => (float) Sale::where('branch_id', $b->id)
                    ->where('status', 'completed')
                    ->whereBetween(
                        'sale_date',
                        [$monthStart, $monthEnd]
                    )
                    ->sum('total_amount'),
            ])
            ->values();

        return [
            /*
            |--------------------------------------------------------------------------
            | MONTHLY REVENUE
            |--------------------------------------------------------------------------
            */
            'totalRevenue' => [
                'value' => (float) $totalRevenue,

                'format' => 'currency',

                'change' => [
                    'direction' => 'up',
                    'label' => now()->format('F Y'),
                ],

                'breakdown' => $revenueBreakdown,
            ],

            /*
            |--------------------------------------------------------------------------
            | TODAY'S SALES
            |--------------------------------------------------------------------------
            */
            'todaysSales' => [
                'value' => (float) $todaysSales,

                'format' => 'currency',

                'change' => [
                    'direction' => 'up',
                    'label' => 'Today',
                ],

                'breakdown' => $visibleBranches
                    ->map(fn (Branch $b) => [
                        'branchId' => $b->id,

                        'branchName' => $this->branchName($b),

                        'value' => (float) Sale::where(
                            'branch_id',
                            $b->id
                        )
                            ->where('status', 'completed')
                            ->where('sale_date', '>=', $todayStart)
                            ->sum('total_amount'),
                    ])
                    ->values(),
            ],

            /*
            |--------------------------------------------------------------------------
            | TOTAL TRANSACTIONS
            |--------------------------------------------------------------------------
            */
            'totalTransactions' => [
                'value' => $totalTransactions,

                'format' => 'number',

                'change' => [
                    'direction' => 'up',
                    'label' => 'Last 7 days',
                ],

                'breakdown' => $visibleBranches
                    ->map(fn (Branch $b) => [
                        'branchId' => $b->id,

                        'branchName' => $this->branchName($b),

                        'value' => Sale::where(
                            'branch_id',
                            $b->id
                        )
                            ->where('status', 'completed')
                            ->where('sale_date', '>=', $weekAgo)
                            ->count(),
                    ])
                    ->values(),
            ],

            /*
            |--------------------------------------------------------------------------
            | LOW STOCK
            |--------------------------------------------------------------------------
            */
            'lowStockItems' => [
                'value' => $lowStockCount,

                'format' => 'number',

                'change' => [
                    'direction' => $lowStockCount > 0
                        ? 'down'
                        : 'up',

                    'label' => $lowStockCount > 0
                        ? 'Needs attention'
                        : 'All stocked',
                ],

                'breakdown' => $visibleBranches
                    ->map(fn (Branch $b) => [
                        'branchId' => $b->id,

                        'branchName' => $this->branchName($b),

                        'value' => Ingredient::where(
                            'branch_id',
                            $b->id
                        )
                            ->where('status', 'active')
                            ->whereColumn(
                                'stock',
                                '<=',
                                'low_stock_threshold'
                            )
                            ->count(),
                    ])
                    ->values(),
            ],

            /*
            |--------------------------------------------------------------------------
            | ACTIVE STAFF
            |--------------------------------------------------------------------------
            */
            'activeStaff' => [
                'value' => $activeStaffCount,

                'format' => 'number',

                'change' => [
                    'direction' => 'up',
                    'label' => 'Currently active',
                ],

                'breakdown' => $visibleBranches
                    ->map(fn (Branch $b) => [
                        'branchId' => $b->id,

                        'branchName' => $this->branchName($b),

                        'value' => User::where(
                            'branch_id',
                            $b->id
                        )
                            ->where('status', 'active')
                            ->where('role', '!=', 'owner')
                            ->count(),
                    ])
                    ->values(),
            ],

            /*
            |--------------------------------------------------------------------------
            | ATTENDANCE TODAY
            |--------------------------------------------------------------------------
            */
            'attendanceToday' => [
                'value' => "{$presentToday}/{$activeStaffCount}",

                'format' => 'text',

                'change' => [
                    'direction' => 'up',
                    'label' => 'Present today',
                ],

                'breakdown' => $visibleBranches
                    ->map(fn (Branch $b) => [
                        'branchId' => $b->id,

                        'branchName' => $this->branchName($b),

                        'value' =>
                            AttendanceLog::where(
                                'branch_id',
                                $b->id
                            )
                                ->where(
                                    'work_date',
                                    now()->toDateString()
                                )
                                ->where('status', '!=', 'absent')
                                ->count()
                            . '/'
                            . User::where(
                                'branch_id',
                                $b->id
                            )
                                ->where('status', 'active')
                                ->where('role', '!=', 'owner')
                                ->count(),
                    ])
                    ->values(),
            ],

            /*
            |--------------------------------------------------------------------------
            | PENDING TASKS
            |--------------------------------------------------------------------------
            */
            'pendingTasks' => [
                'value' => $pendingTasksCount,

                'format' => 'number',

                'change' => [
                    'direction' => 'down',
                    'label' => 'Open items',
                ],

                'breakdown' => $visibleBranches
                    ->map(fn (Branch $b) => [
                        'branchId' => $b->id,

                        'branchName' => $this->branchName($b),

                        'value' => StaffTask::where(
                            'branch_id',
                            $b->id
                        )
                            ->whereIn(
                                'status',
                                ['pending', 'in_progress']
                            )
                            ->count(),
                    ])
                    ->values(),
            ],

            /*
            |--------------------------------------------------------------------------
            | BRANCH GROWTH
            |--------------------------------------------------------------------------
            */
            'branchGrowth' => [
                'value' => $this->formatGrowthPercentage(
                    $branchIds
                ),

                'format' => 'text',

                'change' => [
                    'direction' => 'up',
                    'label' => 'Week over week',
                ],

                'breakdown' => $visibleBranches
                    ->map(fn (Branch $b) => [
                        'branchId' => $b->id,

                        'branchName' => $this->branchName($b),

                        'value' =>
                            $this->formatGrowthPercentage(
                                collect([$b->id])
                            ),
                    ])
                    ->values(),
            ],
        ];
    }

    /**
     * Week-over-week revenue growth.
     */
    private function formatGrowthPercentage($branchIds): string
    {
        $thisWeek = Sale::whereIn('branch_id', $branchIds)
            ->where('status', 'completed')
            ->where(
                'sale_date',
                '>=',
                now()->copy()->subDays(7)
            )
            ->sum('total_amount');

        $lastWeek = Sale::whereIn('branch_id', $branchIds)
            ->where('status', 'completed')
            ->whereBetween(
                'sale_date',
                [
                    now()->copy()->subDays(14),
                    now()->copy()->subDays(7),
                ]
            )
            ->sum('total_amount');

        if ($lastWeek == 0) {
            return $thisWeek > 0
                ? '+100%'
                : '0%';
        }

        $percent = (
            ($thisWeek - $lastWeek) / $lastWeek
        ) * 100;

        return ($percent >= 0 ? '+' : '')
            . number_format($percent, 1)
            . '%';
    }

    /**
     * Branch comparison graph data.
     *
     * Revenue and transactions are CURRENT MONTH.
     */
    private function buildBranchComparison(
        $branches,
        bool $isOwner,
        ?int $userBranchId
    ): array {
        $monthStart = now()->copy()->startOfMonth();
        $monthEnd = now()->copy()->endOfMonth();

        $visibleBranches = $isOwner
            ? $branches
            : $branches->where('id', $userBranchId);

        return $visibleBranches
            ->map(fn (Branch $b) => [
                'branchId' => $b->id,

                'branchName' => $this->branchName($b),

                /*
                 * CURRENT MONTH REVENUE
                 */
                'revenue' => (float) Sale::where(
                    'branch_id',
                    $b->id
                )
                    ->where('status', 'completed')
                    ->whereBetween(
                        'sale_date',
                        [$monthStart, $monthEnd]
                    )
                    ->sum('total_amount'),

                /*
                 * CURRENT MONTH TRANSACTIONS
                 */
                'transactions' => Sale::where(
                    'branch_id',
                    $b->id
                )
                    ->where('status', 'completed')
                    ->whereBetween(
                        'sale_date',
                        [$monthStart, $monthEnd]
                    )
                    ->count(),

                /*
                 * ACTIVE STAFF
                 */
                'staff' => User::where(
                    'branch_id',
                    $b->id
                )
                    ->where('status', 'active')
                    ->where('role', '!=', 'owner')
                    ->count(),
            ])
            ->values()
            ->all();
    }

    /**
     * Five most recent completed sales.
     */
    private function buildRecentSales(
        bool $isOwner,
        ?int $userBranchId
    ): array {
        return $this->scopeToUserBranch(
            Sale::query()
                ->where('status', 'completed')
                ->with(['branch', 'staff'])
        )
            ->orderByDesc('sale_date')
            ->limit(5)
            ->get()
            ->map(fn (Sale $s) => [
                'id' => $s->id,

                'transactionNumber' =>
                    $s->transaction_number,

                'branchName' =>
                    $s->branch?->name
                        ? $this->branchName($s->branch)
                        : '',

                'staffName' =>
                    $s->staff?->name ?? '',

                'amount' =>
                    (float) $s->total_amount,

                'paymentMethod' =>
                    $s->payment_method,

                'saleDate' =>
                    $s->sale_date?->format(
                        'Y-m-d H:i'
                    ),
            ])
            ->all();
    }

    /**
     * Low stock ingredients from the current inventory module.
     */
    private function buildLowStock(
        bool $isOwner,
        ?int $userBranchId
    ): array {
        return $this->scopeToUserBranch(
            Ingredient::query()
                ->where('status', 'active')
                ->whereColumn(
                    'stock',
                    '<=',
                    'low_stock_threshold'
                )
                ->with('branch')
        )
            ->orderBy('stock')
            ->get()
            ->map(fn (Ingredient $ingredient) => [
                'id' => $ingredient->id,

                'name' => $ingredient->name,

                'category' => $ingredient->category,

                'branchName' =>
                    $ingredient->branch?->name
                        ? $this->branchName($ingredient->branch)
                        : '',

                'stock' => (float) $ingredient->stock,

                'unit' => $ingredient->unit,

                'lowStockThreshold' =>
                    (float) $ingredient->low_stock_threshold,
            ])
            ->all();
    }

    /**
     * Today's attendance records.
     */
    private function buildAttendanceSummary(
        bool $isOwner,
        ?int $userBranchId
    ): array {
        return $this->scopeToUserBranch(
            AttendanceLog::query()
                ->where(
                    'work_date',
                    now()->toDateString()
                )
                ->with(['user', 'branch'])
        )
            ->get()
            ->map(fn (AttendanceLog $log) => [
                'id' => $log->id,

                'staffName' =>
                    $log->user?->name ?? '',

                'branchName' =>
                    $log->branch?->name
                        ? $this->branchName($log->branch)
                        : '',

                'timeIn' =>
                    $log->time_in?->format('h:i A'),

                'timeOut' =>
                    $log->time_out?->format('h:i A'),

                'status' =>
                    $log->status,
            ])
            ->all();
    }

    /**
     * Five upcoming/open tasks.
     */
    private function buildPendingTasks(
        bool $isOwner,
        ?int $userBranchId
    ): array {
        return $this->scopeToUserBranch(
            StaffTask::query()
                ->whereIn(
                    'status',
                    ['pending', 'in_progress']
                )
                ->with(['branch', 'assignee'])
        )
            ->orderBy('due_date')
            ->limit(5)
            ->get()
            ->map(fn (StaffTask $t) => [
                'id' => $t->id,

                'title' => $t->title,

                'branchName' =>
                    $t->branch?->name
                        ? $this->branchName($t->branch)
                        : '',

                'assignedTo' =>
                    $t->assignee?->name ?? '',

                'priority' =>
                    $t->priority,

                'dueDate' =>
                    $t->due_date?->toDateString(),
            ])
            ->all();
    }

    /**
     * Consistent short branch name.
     */
    private function branchName(Branch $branch): string
    {
        return str_replace(
            'Mabi Sip and Bites ',
            '',
            $branch->name
        );
    }
}
