<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSaleRequest;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use App\Traits\BranchScoped;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    use BranchScoped;

    public function index(): Response
    {
        $sales = $this->scopeToUserBranch(
            Sale::query()->where('status', 'completed')->with(['branch', 'customer', 'staff'])
        )
            ->orderByDesc('sale_date')
            ->get()
            ->map(fn (Sale $sale) => $this->presentSale($sale));

        return Inertia::render('Sales/Index', [
            'sales' => $sales,
        ]);
    }

    /**
     * Creates a sale and deducts stock atomically.
     *
     * Per 07_BACKEND_CONTROLLERS_AND_ROUTES.md "Inventory Stock Behavior":
     * validate stock, deduct sold quantity, prevent overselling. The whole
     * operation runs inside a DB transaction with row locking (lockForUpdate)
     * on each product so two simultaneous sales for the same product can't
     * both read stale stock and oversell it — without the lock, two staff
     * ringing up the last item at the same moment could both pass validation
     * before either deduction commits.
     */
    public function store(StoreSaleRequest $request): RedirectResponse
    {
        $this->authorizeBranch((int) $request->validated('branch_id'));

        try {
            DB::transaction(function () use ($request) {
                $items = $request->validated('items');
                $branchId = (int) $request->validated('branch_id');

                $lockedProducts = [];
                $totalAmount = 0;

                // Lock and validate every line item before writing anything.
                foreach ($items as $item) {
                    $product = Product::where('id', $item['product_id'])
                        ->where('branch_id', $branchId)
                        ->lockForUpdate()
                        ->first();

                    if (! $product) {
                        throw ValidationException::withMessages([
                            'items' => "One of the selected products does not belong to this branch.",
                        ]);
                    }

                    if ($product->stock < $item['quantity']) {
                        throw ValidationException::withMessages([
                            'items' => "Not enough stock for \"{$product->name}\". Available: {$product->stock}.",
                        ]);
                    }

                    $lockedProducts[$item['product_id']] = [
                        'product' => $product,
                        'quantity' => $item['quantity'],
                        'unit_price' => $product->selling_price,
                    ];

                    $totalAmount += $product->selling_price * $item['quantity'];
                }

                $sale = Sale::create([
                    'branch_id' => $branchId,
                    'customer_id' => $request->validated('customer_id'),
                    'staff_id' => $request->validated('staff_id'),
                    'transaction_number' => $this->generateTransactionNumber(),
                    'total_amount' => $totalAmount,
                    'payment_method' => $request->validated('payment_method'),
                    'sale_date' => now(),
                    'status' => 'completed',
                ]);

                foreach ($lockedProducts as $entry) {
                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => $entry['product']->id,
                        'quantity' => $entry['quantity'],
                        'unit_price' => $entry['unit_price'],
                        'subtotal' => $entry['unit_price'] * $entry['quantity'],
                    ]);

                    $entry['product']->decrement('stock', $entry['quantity']);
                }
            });
        } catch (ValidationException $e) {
            return redirect()->back()->withErrors($e->errors())->with('error', 'Unable to record sale.');
        }

        return redirect()->back()->with('success', 'Sale recorded successfully.');
    }

    private function generateTransactionNumber(): string
    {
        return 'TXN-' . now()->format('Ymd') . '-' . str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
    }

    private function presentSale(Sale $sale): array
    {
        return [
            'id' => $sale->id,
            'branch_id' => $sale->branch_id,
            'branch_name' => $sale->branch?->name ? str_replace('Mabi Sip and Bites ', '', $sale->branch->name) : '',
            'customer_id' => $sale->customer_id,
            'customer_name' => $sale->customer?->name ?? 'Walk-in',
            'staff_id' => $sale->staff_id,
            'staff_name' => $sale->staff?->name ?? '',
            'transaction_number' => $sale->transaction_number,
            'total_amount' => (float) $sale->total_amount,
            'payment_method' => $sale->payment_method,
            'sale_date' => $sale->sale_date?->toIso8601String(),
            'status' => $sale->status,
        ];
    }
}
