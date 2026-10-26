<?php

namespace App\Http\Controllers;

use App\Models\AttendanceLog;
use App\Models\AttendanceSession;
use App\Models\Branch;
use App\Models\Ingredient;
use App\Models\Sale;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        [$startDate, $endDate, $branchId] =
            $this->parseFilters($request);

        return Inertia::render('Reports/Index', [
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'branch_id' => $branchId,
            ],

            'salesReport' =>
                $this->buildSalesReport(
                    $startDate,
                    $endDate,
                    $branchId,
                    $user
                ),

            'inventoryReport' =>
                $this->buildInventoryReport(
                    $branchId,
                    $user
                ),

            'attendanceReport' =>
                $this->buildAttendanceReport(
                    $startDate,
                    $endDate,
                    $branchId,
                    $user
                ),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | SALES PDF
    |--------------------------------------------------------------------------
    */

    public function exportSalesPdf(
        Request $request
    ): HttpResponse {
        $user = $request->user();

        [$startDate, $endDate, $branchId] =
            $this->parseFilters($request);

        $report =
            $this->buildSalesReport(
                $startDate,
                $endDate,
                $branchId,
                $user
            );

        $pdf = Pdf::loadView(
            'reports.sales-pdf',
            [
                'report' => $report,

                'startDate' =>
                    $startDate,

                'endDate' =>
                    $endDate,

                'branchLabel' =>
                    $this->branchLabel(
                        $branchId,
                        $user
                    ),

                'branchLocation' => $this->branchLocation($branchId, $user),

                'generatedAt' =>
                    now()->format(
                        'F d, Y h:i A'
                    ),
            ]
        )->setPaper(
            'a4',
            'portrait'
        );

        return $pdf->download(
            "sales-report-{$startDate}-to-{$endDate}.pdf"
        );
    }

    /*
    |--------------------------------------------------------------------------
    | INVENTORY PDF
    |--------------------------------------------------------------------------
    */

    public function exportInventoryPdf(
        Request $request
    ): HttpResponse {
        $user = $request->user();

        [, , $branchId] =
            $this->parseFilters($request);

        $report =
            $this->buildInventoryReport(
                $branchId,
                $user
            );

        $pdf = Pdf::loadView(
            'reports.inventory-pdf',
            [
                'report' => $report,

                'branchLabel' =>
                    $this->branchLabel(
                        $branchId,
                        $user
                    ),

                'branchLocation' => $this->branchLocation($branchId, $user),

                'generatedAt' =>
                    now()->format(
                        'F d, Y h:i A'
                    ),
            ]
        )->setPaper(
            'a4',
            'portrait'
        );

        return $pdf->download(
            'inventory-report-' .
            now()->format('Y-m-d') .
            '.pdf'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | ATTENDANCE PDF
    |--------------------------------------------------------------------------
    */

    public function exportAttendancePdf(
        Request $request
    ): HttpResponse {
        $user = $request->user();

        [$startDate, $endDate, $branchId] =
            $this->parseFilters($request);

        $report =
            $this->buildAttendanceReport(
                $startDate,
                $endDate,
                $branchId,
                $user
            );

        $pdf = Pdf::loadView(
            'reports.attendance-pdf',
            [
                'report' => $report,

                'startDate' =>
                    $startDate,

                'endDate' =>
                    $endDate,

                'branchLabel' =>
                    $this->branchLabel(
                        $branchId,
                        $user
                    ),

                'branchLocation' => $this->branchLocation($branchId, $user),

                'generatedAt' =>
                    now()->format(
                        'F d, Y h:i A'
                    ),
            ]
        )->setPaper(
            'a4',
            'landscape'
        );

        return $pdf->download(
            "attendance-report-{$startDate}-to-{$endDate}.pdf"
        );
    }

    /*
    |--------------------------------------------------------------------------
    | FILTERS
    |--------------------------------------------------------------------------
    */

    private function parseFilters(
        Request $request
    ): array {
        $user = $request->user();

        $startDate =
            $request->query(
                'start_date',
                now()
                    ->startOfMonth()
                    ->toDateString()
            );

        $endDate =
            $request->query(
                'end_date',
                now()->toDateString()
            );

        /*
         * Owner follows the global branch selector.
         * Manager/staff are permanently assigned to one branch.
         */
        if ($user->isOwner()) {
            $branchId =
                $request->query(
                    'branch_id'
                );

            if ($branchId) {
                $valid =
                    Branch::query()
                        ->whereKey(
                            $branchId
                        )
                        ->where(
                            'status',
                            'active'
                        )
                        ->exists();

                if (! $valid) {
                    $branchId = null;
                }
            }
        } else {
            $branchId =
                $user->branch_id;
        }

        return [
            $startDate,
            $endDate,
            $branchId,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | SALES REPORT
    |--------------------------------------------------------------------------
    */

    private function buildSalesReport(
        string $startDate,
        string $endDate,
        ?string $branchId,
        User $user
    ): array {
        $query = Sale::query()
            ->where(
                'status',
                'completed'
            )
            ->whereBetween(
                'sale_date',
                [
                    "{$startDate} 00:00:00",
                    "{$endDate} 23:59:59",
                ]
            )
            ->with([
                'branch',
                'staff',
                'customer',
            ]);

        if ($branchId) {
            $query->where(
                'branch_id',
                $branchId
            );
        }

        $sales = $query
            ->orderByDesc(
                'sale_date'
            )
            ->get();

        $totalRevenue =
            (float)
                $sales->sum(
                    'total_amount'
                );

        $totalTransactions =
            $sales->count();

        $averageSale =
            $totalTransactions > 0
                ? $totalRevenue /
                    $totalTransactions
                : 0;

        $byPayment =
            $sales
                ->groupBy(
                    'payment_method'
                )
                ->map(
                    function (
                        $items,
                        $method
                    ) {
                        return [
                            'method' =>
                                $method,

                            'count' =>
                                $items->count(),

                            'total' =>
                                (float)
                                    $items->sum(
                                        'total_amount'
                                    ),
                        ];
                    }
                )
                ->values();

        $transactions =
            $sales
                ->map(
                    function (
                        Sale $sale
                    ) {
                        return [
                            'transaction_number' =>
                                $sale
                                    ->transaction_number,

                            'branch_name' =>
                                $this->shortBranchName(
                                    $sale->branch
                                        ?->name
                                ),

                            'staff_name' =>
                                $sale->staff
                                    ?->name ??
                                '—',

                            'customer_name' =>
                                $sale->customer
                                    ?->name ??
                                'Walk-in',

                            'payment_method' =>
                                $sale
                                    ->payment_method,

                            'total_amount' =>
                                (float)
                                    $sale
                                        ->total_amount,

                            'sale_date' =>
                                $sale
                                    ->sale_date
                                    ?->format(
                                        'M d, Y h:i A'
                                    ),
                        ];
                    }
                )
                ->values();

        return [
            'totalRevenue' =>
                $totalRevenue,

            'totalTransactions' =>
                $totalTransactions,

            'averageSale' =>
                $averageSale,

            'byPaymentMethod' =>
                $byPayment,

            'transactions' =>
                $transactions,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | INVENTORY REPORT
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | Inventory is now INGREDIENT-based, not Product.stock.
    |
    */

    private function buildInventoryReport(
        ?string $branchId,
        User $user
    ): array {
        $query =
            Ingredient::query()
                ->where(
                    'status',
                    'active'
                )
                ->with([
                    'branch',
                    'products:id,name',
                ]);

        if ($branchId) {
            $query->where(
                'branch_id',
                $branchId
            );
        }

        $ingredients =
            $query
                ->orderBy(
                    'category'
                )
                ->orderBy(
                    'name'
                )
                ->get();

        $totalIngredients =
            $ingredients->count();

        $lowStockCount =
            $ingredients
                ->filter(
                    fn (
                        Ingredient $ingredient
                    ) =>
                        (float)
                            $ingredient
                                ->stock <=
                        (float)
                            $ingredient
                                ->low_stock_threshold
                )
                ->count();

        $outOfStockCount =
            $ingredients
                ->filter(
                    fn (
                        Ingredient $ingredient
                    ) =>
                        (float)
                            $ingredient
                                ->stock <=
                        0
                )
                ->count();

        /*
         * Inventory value:
         * stock × cost price
         *
         * This is more correct than selling price because
         * these are raw ingredients.
         */
        $totalStockValue =
            $ingredients
                ->sum(
                    function (
                        Ingredient $ingredient
                    ) {
                        return
                            (float)
                                $ingredient
                                    ->stock *
                            (float)
                                (
                                    $ingredient
                                        ->cost_price ??
                                    0
                                );
                    }
                );

        $rows =
            $ingredients
                ->map(
                    function (
                        Ingredient $ingredient
                    ) {
                        $stock =
                            (float)
                                $ingredient
                                    ->stock;

                        $threshold =
                            (float)
                                $ingredient
                                    ->low_stock_threshold;

                        if ($stock <= 0) {
                            $stockStatus =
                                'Out of stock';
                        } elseif (
                            $stock <=
                            $threshold
                        ) {
                            $stockStatus =
                                'Low stock';
                        } else {
                            $stockStatus =
                                'Available';
                        }

                        return [
                            'name' =>
                                $ingredient
                                    ->name,

                            'category' =>
                                $ingredient
                                    ->category,

                            'branch_name' =>
                                $this->shortBranchName(
                                    $ingredient
                                        ->branch
                                        ?->name
                                ),

                            'stock' =>
                                $stock,

                            'unit' =>
                                $ingredient
                                    ->unit,

                            'low_stock_threshold' =>
                                $threshold,

                            'cost_price' =>
                                $ingredient
                                    ->cost_price !==
                                null
                                    ? (float)
                                        $ingredient
                                            ->cost_price
                                    : null,

                            'stock_value' =>
                                $stock *
                                (float)
                                    (
                                        $ingredient
                                            ->cost_price ??
                                        0
                                    ),

                            'stock_status' =>
                                $stockStatus,

                            'used_by' =>
                                $ingredient
                                    ->products
                                    ->pluck(
                                        'name'
                                    )
                                    ->values()
                                    ->all(),
                        ];
                    }
                )
                ->values();

        return [
            'totalIngredients' =>
                $totalIngredients,

            'totalStockValue' =>
                (float)
                    $totalStockValue,

            'lowStockCount' =>
                $lowStockCount,

            'outOfStockCount' =>
                $outOfStockCount,

            'ingredients' =>
                $rows,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | ATTENDANCE REPORT
    |--------------------------------------------------------------------------
    */

    private function buildAttendanceReport(
        string $startDate,
        string $endDate,
        ?string $branchId,
        User $user
    ): array {
        $query =
            AttendanceLog::query()
                ->whereBetween(
                    'work_date',
                    [
                        $startDate,
                        $endDate,
                    ]
                )
                ->with([
                    'user',
                    'branch',
                    'sessions',
                ]);

        if ($branchId) {
            $query->where(
                'branch_id',
                $branchId
            );
        }

        /*
         * Staff accounts should only ever see themselves.
         */
        if ($user->isStaff()) {
            $query->where(
                'user_id',
                $user->id
            );
        }

        $logs =
            $query
                ->orderByDesc(
                    'work_date'
                )
                ->get();

        $rows =
            $logs
                ->map(
                    function (
                        AttendanceLog $log
                    ) {
                        $sessions =
                            $log
                                ->sessions;

                        $workedMinutes = (int) \App\Services\AttendanceHours::workedMinutes($sessions);

                        $hours =
                            intdiv(
                                $workedMinutes,
                                60
                            );

                        $minutes =
                            $workedMinutes %
                            60;

                        $firstIn =
                            $sessions
                                ->first()
                                ?->time_in;

                        $lastOut =
                            $sessions
                                ->last()
                                ?->time_out;

                        return [
                            'staff_name' =>
                                $log
                                    ->user
                                    ?->name ??
                                '—',

                            'branch_name' =>
                                $this->shortBranchName(
                                    $log
                                        ->branch
                                        ?->name
                                ),

                            'work_date' =>
                                $log
                                    ->work_date
                                    ?->format(
                                        'M d, Y'
                                    ),

                            'first_time_in' =>
                                $firstIn
                                    ?->format(
                                        'h:i A'
                                    ) ??
                                '—',

                            'last_time_out' =>
                                $lastOut
                                    ?->format(
                                        'h:i A'
                                    ) ??
                                '—',

                            'sessions' =>
                                $sessions
                                    ->count(),

                            'worked_minutes' =>
                                $workedMinutes,

                            'worked_time' =>
                                sprintf(
                                    '%dh %02dm',
                                    $hours,
                                    $minutes
                                ),

                            'status' => ! $sessions->isEmpty() || $log->time_in
                                ? ($log->time_in?->format('H:i:s') > '09:15:00' ? 'late' : 'present')
                                : 'absent',
                        ];
                    }
                )
                ->values();

        $totalWorkedMinutes =
            $rows->sum(
                'worked_minutes'
            );

        return [
            'totalLogs' =>
                $rows->count(),

            'present' => $rows->whereIn('status', ['present', 'late'])->count(),

            'absent' =>
                $rows
                    ->where(
                        'status',
                        'absent'
                    )
                    ->count(),

            /*
             * Late is intentionally 0 until Shift/Schedule
             * provides an actual expected time-in.
             */
            'late' => $rows->where('status', 'late')->count(),

            'totalWorkedMinutes' =>
                $totalWorkedMinutes,

            'totalWorkedTime' =>
                sprintf(
                    '%dh %02dm',
                    intdiv(
                        $totalWorkedMinutes,
                        60
                    ),
                    $totalWorkedMinutes %
                    60
                ),

            'records' =>
                $rows,
        ];
    }

    private function branchLocation(?string $branchId, User $user): string
    {
        $id = $branchId ?: ($user->isOwner() ? null : $user->branch_id);
        if (! $id) {
            return 'Multiple locations';
        }
        return Branch::find($id)?->location ?: 'Location not provided';
    }

    private function branchLabel(
        ?string $branchId,
        User $user
    ): string {
        if (! $branchId) {
            return 'All branches';
        }

        $branch =
            Branch::find(
                $branchId
            );

        return $branch
            ? $this->shortBranchName(
                $branch->name
            )
            : 'Branch';
    }

    private function shortBranchName(
        ?string $name
    ): string {
        if (! $name) {
            return '—';
        }

        return str_replace(
            'Mabi Sip and Bites ',
            '',
            $name
        );
    }
}