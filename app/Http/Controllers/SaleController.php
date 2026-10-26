<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSaleRequest;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\Ingredient;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Models\Category;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class SaleController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $selectedBranchId = null;

        $query = Sale::query()
            ->where('status', 'completed')
            ->with([
                'branch',
                'customer',
                'staff',
                'saleItems.product',
            ]);

        if ($user->isOwner()) {
            $requestedBranchId = $request->integer('branch_id');

            if ($requestedBranchId) {
                $validBranch = Branch::query()
                    ->whereKey($requestedBranchId)
                    ->where('status', 'active')
                    ->exists();

                if ($validBranch) {
                    $selectedBranchId = $requestedBranchId;

                    $query->where(
                        'branch_id',
                        $requestedBranchId
                    );
                }
            }
        } else {
            $selectedBranchId = $user->branch_id;

            $query->where(
                'branch_id',
                $user->branch_id
            );
        }

        $sales = $query
            ->orderByDesc('sale_date')
            ->get()
            ->map(
                fn (Sale $sale) =>
                    $this->presentSale($sale)
            )
            ->values();

        return Inertia::render('Sales/Index', [
            'sales' => $sales,
            'selectedBranchId' => $selectedBranchId,
        ]);
    }

    public function pos(Request $request): Response
    {
        $user = $request->user();

        /*
        |--------------------------------------------------------------------------
        | Resolve active branch
        |--------------------------------------------------------------------------
        */

        if ($user->isOwner()) {
            $branchId = $request->integer('branch_id');

            if (
                $branchId &&
                ! Branch::query()
                    ->whereKey($branchId)
                    ->where('status', 'active')
                    ->exists()
            ) {
                $branchId = null;
            }
        } else {
            $branchId = $user->branch_id;
        }

        /*
        |--------------------------------------------------------------------------
        | Owner selected "All branches"
        |--------------------------------------------------------------------------
        */


        $categoryOptions = Category::query()
            ->active()->where('branch_id', $branchId ?? -1)->where('show_in_pos', true)
            ->orderBy('name')
            ->get()
            ->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'image_url' => $category->image_url,
            ])
            ->values();

        $categoryImagesByName = $categoryOptions->mapWithKeys(
            fn (array $category) => [
                Str::lower(trim($category['name'])) => $category['image_url'],
            ]
        );

        if (! $branchId) {
            return Inertia::render('POS/Index', [
                'selectedBranchId' => null,
                'customerOptions' => [],
                'productOptions' => [],
                'categoryOptions' => $categoryOptions,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Customers
        |--------------------------------------------------------------------------
        */

        $customers = Customer::query()
            ->where('branch_id', $branchId)
            ->where('status', 'active')
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'branch_id',
            ]);

        /*
        |--------------------------------------------------------------------------
        | Products with their COMPLETE ingredient recipes
        |--------------------------------------------------------------------------
        */

        $products = Product::query()
            ->where('branch_id', $branchId)
            ->where('status', 'active')
            ->with([
                'ingredients' => function ($query) use ($branchId) {
                    $query
                        ->where('ingredients.branch_id', $branchId)
                        ->where('ingredients.status', 'active');
                },
            ])
            ->orderBy('name')
            ->get()
            ->map(function (Product $product) use ($categoryImagesByName) {
                $isMilkTea =
                    $this->isMilkTea($product);

                /*
                 * Calculate availability for every available size.
                 */
                $availability = $isMilkTea
                    ? [
                        '16' => $this->calculateAvailability(
                            $product,
                            16
                        ),

                        '18' => $this->calculateAvailability(
                            $product,
                            18
                        ),

                        '22' => $this->calculateAvailability(
                            $product,
                            22
                        ),
                    ]
                    : [
                        'default' => $this->calculateAvailability(
                            $product
                        ),
                    ];

                return [
                    'id' => $product->id,

                    'name' => $product->name,

                    'category' => $product->category,

                    'branch_id' => $product->branch_id,

                    'selling_price' =>
                        (float) $product->selling_price,

                    'image_url' => ($product->category_id ? Category::find($product->category_id)?->image_url : null)
                        ?: $product->image_url
                        ?: $categoryImagesByName->get(
                            Str::lower(trim($product->name ?? ''))
                        )
                        ?: $categoryImagesByName->get(
                            Str::lower(trim($product->category ?? ''))
                        ),

                    'is_milk_tea' =>
                        $isMilkTea,

                    /*
                     * If there is no recipe, POS blocks the product.
                     */
                    'inventory_configured' =>
                        $product->ingredients->isNotEmpty(),

                    'availability' =>
                        $availability,

                    /*
                     * Useful for displaying which ingredients are required.
                     */
                    'ingredients' =>
                        $product->ingredients
                            ->map(function ($ingredient) {
                                return [
                                    'id' =>
                                        $ingredient->id,

                                    'name' =>
                                        $ingredient->name,

                                    'stock' =>
                                        (float) $ingredient->stock,

                                    'unit' =>
                                        $ingredient->unit,

                                    'quantity_16' =>
                                        $ingredient->pivot->quantity_16 !== null
                                            ? (float) $ingredient->pivot->quantity_16
                                            : null,

                                    'quantity_18' =>
                                        $ingredient->pivot->quantity_18 !== null
                                            ? (float) $ingredient->pivot->quantity_18
                                            : null,

                                    'quantity_22' =>
                                        $ingredient->pivot->quantity_22 !== null
                                            ? (float) $ingredient->pivot->quantity_22
                                            : null,

                                    'quantity_per_order' =>
                                        $ingredient->pivot->quantity_per_order !== null
                                            ? (float) $ingredient->pivot->quantity_per_order
                                            : null,
                                ];
                            })
                            ->values(),
                ];
            })
            ->values();

        return Inertia::render('POS/Index', [
            'selectedBranchId' => $branchId,
            'productOptions' => $products,
            'categoryOptions' => $categoryOptions,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Calculate how many orders can be made
    |--------------------------------------------------------------------------
    |
    | Availability is determined by the ingredient that runs out FIRST.
    |
    | Example:
    |
    | Chocolate Powder -> 2 cups
    | Black Tea        -> 10 cups
    | Creamer          -> 8 cups
    | Straw            -> 20 cups
    |
    | Maximum = 2 cups
    |
    */

    private function calculateAvailability(
        Product $product,
        ?int $sizeOz = null
    ): array {
        if ($product->ingredients->isEmpty()) {
            return [
                'available' => false,
                'maximum' => 0,
                'limiting_ingredient' => null,
                'reason' => 'Inventory recipe not configured.',
            ];
        }

        $maximum = null;

        $limitingIngredient = null;

        $requiredIngredientCount = 0;

        foreach ($product->ingredients as $ingredient) {
            if ($sizeOz !== null) {
                $column = match ($sizeOz) {
                    16 => 'quantity_16',
                    18 => 'quantity_18',
                    22 => 'quantity_22',
                    default => null,
                };

                if (! $column) {
                    continue;
                }

                $required =
                    (float) (
                        $ingredient->pivot->{$column}
                        ?? 0
                    );
            } else {
                $required =
                    (float) (
                        $ingredient->pivot->quantity_per_order
                        ?? 0
                    );
            }

            /*
             * This ingredient does not apply to this size/order.
             *
             * Example:
             * 16 oz Cup has quantity_18 = null.
             */
            if ($required <= 0) {
                continue;
            }

            $requiredIngredientCount++;

            $availableStock =
                (float) $ingredient->stock;

            $possibleOrders = (int) floor(
                $availableStock / $required
            );

            if (
                $maximum === null ||
                $possibleOrders < $maximum
            ) {
                $maximum =
                    $possibleOrders;

                $limitingIngredient =
                    $ingredient->name;
            }
        }

        /*
         * Product recipe exists, but nothing applies to this selected size.
         */
        if ($requiredIngredientCount === 0) {
            return [
                'available' => false,
                'maximum' => 0,
                'limiting_ingredient' => null,
                'reason' =>
                    'No ingredient recipe exists for this size.',
            ];
        }

        $maximum ??= 0;

        return [
            'available' =>
                $maximum > 0,

            'maximum' =>
                $maximum,

            'limiting_ingredient' =>
                $limitingIngredient,

            'reason' =>
                $maximum > 0
                    ? null
                    : "{$limitingIngredient} is out of stock.",
        ];
    }

    public function store(
        StoreSaleRequest $request
    ): RedirectResponse {
        $branchId =
            (int) $request->validated('branch_id');

        $actor =
            $request->user();

        /*
        |--------------------------------------------------------------------------
        | Branch authorization
        |--------------------------------------------------------------------------
        */

        if (! $actor->isOwner()) {
            abort_unless(
                (int) $actor->branch_id === $branchId,
                403
            );
        }

        $validBranch =
            Branch::query()
                ->whereKey($branchId)
                ->where('status', 'active')
                ->exists();

        abort_unless(
            $validBranch,
            404
        );

        /*
        |--------------------------------------------------------------------------
        | Logged-in user records the transaction
        |--------------------------------------------------------------------------
        */

        $staffId =
            $actor->id;

        $customerId =
            $request->validated('customer_id');

        if (
            $customerId &&
            ! Customer::query()
                ->whereKey($customerId)
                ->where('branch_id', $branchId)
                ->where('status', 'active')
                ->exists()
        ) {
            throw ValidationException::withMessages([
                'customer_id' =>
                    'The selected customer does not belong to this branch.',
            ]);
        }

        try {
            DB::transaction(function () use (
                $request,
                $branchId,
                $staffId,
                $customerId
            ) {
                $items =
                    $request->validated('items');

                $productIds = collect($items)
                    ->pluck('product_id')
                    ->map(fn ($id) => (int) $id)
                    ->unique();

                /*
                |--------------------------------------------------------------------------
                | Load products + complete recipes
                |--------------------------------------------------------------------------
                */

                $products = Product::query()
                    ->where('branch_id', $branchId)
                    ->where('status', 'active')
                    ->whereIn('id', $productIds)
                    ->with([
                        'ingredients' => function ($query) use ($branchId) {
                            $query
                                ->where(
                                    'ingredients.branch_id',
                                    $branchId
                                )
                                ->where(
                                    'ingredients.status',
                                    'active'
                                );
                        },
                    ])
                    ->get()
                    ->keyBy('id');

                if (
                    $products->count() !==
                    $productIds->count()
                ) {
                    throw ValidationException::withMessages([
                        'items' =>
                            'One or more selected products are unavailable for this branch.',
                    ]);
                }

                /*
                |--------------------------------------------------------------------------
                | Lock ingredients
                |--------------------------------------------------------------------------
                */

                $ingredients = Ingredient::query()
                    ->where('branch_id', $branchId)
                    ->where('status', 'active')
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                $prepared = [];

                /*
                 * ingredient_id => total amount to deduct
                 */
                $ingredientDeductions = [];

                $total = 0;

                foreach ($items as $index => $item) {
                    $product =
                        $products->get(
                            (int) $item['product_id']
                        );

                    $quantity =
                        (int) $item['quantity'];

                    $isMilkTea =
                        $this->isMilkTea($product);

                    $sizeOz =
                        isset($item['size_oz'])
                            ? (int) $item['size_oz']
                            : null;

                    /*
                    |--------------------------------------------------------------------------
                    | Validate size
                    |--------------------------------------------------------------------------
                    */

                    if (
                        $isMilkTea &&
                        ! in_array(
                            $sizeOz,
                            [16, 18, 22],
                            true
                        )
                    ) {
                        throw ValidationException::withMessages([
                            "items.$index.size_oz" =>
                                "Select a valid size for {$product->name}.",
                        ]);
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Recipe must exist
                    |--------------------------------------------------------------------------
                    */

                    if ($product->ingredients->isEmpty()) {
                        throw ValidationException::withMessages([
                            'items' =>
                                "\"{$product->name}\" cannot be ordered because its ingredient recipe has not been configured.",
                        ]);
                    }

                    $appliedIngredients = 0;

                    /*
                    |--------------------------------------------------------------------------
                    | Calculate EVERY ingredient deduction
                    |--------------------------------------------------------------------------
                    */

                    foreach (
                        $product->ingredients
                        as $ingredient
                    ) {
                        if ($isMilkTea) {
                            $column = match ($sizeOz) {
                                16 => 'quantity_16',
                                18 => 'quantity_18',
                                22 => 'quantity_22',
                            };

                            $perOrder =
                                (float) (
                                    $ingredient->pivot->{$column}
                                    ?? 0
                                );
                        } else {
                            $perOrder =
                                (float) (
                                    $ingredient->pivot->quantity_per_order
                                    ?? 0
                                );
                        }

                        /*
                         * Ingredient doesn't apply to selected size.
                         */
                        if ($perOrder <= 0) {
                            continue;
                        }

                        $appliedIngredients++;

                        $required =
                            $perOrder *
                            $quantity;

                        $ingredientDeductions[
                            $ingredient->id
                        ] =
                            (
                                $ingredientDeductions[
                                    $ingredient->id
                                ] ?? 0
                            ) +
                            $required;
                    }

                    if ($appliedIngredients === 0) {
                        throw ValidationException::withMessages([
                            'items' =>
                                "\"{$product->name}\" has no ingredient recipe configured for the selected option.",
                        ]);
                    }

                    $unitPrice =
                        (float) $product->selling_price;

                    $subtotal =
                        $unitPrice *
                        $quantity;

                    $total +=
                        $subtotal;

                    $prepared[] = [
                        'product' =>
                            $product,

                        'quantity' =>
                            $quantity,

                        'sizeOz' =>
                            $sizeOz,

                        'unitPrice' =>
                            $unitPrice,

                        'subtotal' =>
                            $subtotal,
                    ];
                }

                /*
                |--------------------------------------------------------------------------
                | FINAL STOCK VALIDATION
                |--------------------------------------------------------------------------
                |
                | Check totals after combining every item in the cart.
                |
                | Important because two different products may both use:
                |
                | - Straw
                | - Tapioca Pearls
                | - Creamer
                | - etc.
                |
                */

                foreach (
                    $ingredientDeductions
                    as $ingredientId => $required
                ) {
                    $ingredient =
                        $ingredients->get(
                            $ingredientId
                        );

                    if (! $ingredient) {
                        throw ValidationException::withMessages([
                            'items' =>
                                'One of the required ingredients is unavailable.',
                        ]);
                    }

                    $available =
                        (float) $ingredient->stock;

                    if (
                        $available <
                        $required
                    ) {
                        throw ValidationException::withMessages([
                            'items' =>
                                "Not enough {$ingredient->name}. Required: {$required} {$ingredient->unit}; available: {$available} {$ingredient->unit}.",
                        ]);
                    }
                }

                /*
                |--------------------------------------------------------------------------
                | Create completed transaction
                |--------------------------------------------------------------------------
                */

                $sale = Sale::create([
                    'branch_id' =>
                        $branchId,

                    'customer_id' =>
                        $customerId,

                    'staff_id' =>
                        $staffId,

                    'transaction_number' =>
                        $this->generateTransactionNumber(),

                    'total_amount' =>
                        $total,

                    'payment_method' =>
                        'cash',

                    'sale_date' =>
                        now(),

                    'status' =>
                        'completed',
                ]);

                /*
                |--------------------------------------------------------------------------
                | Store ordered products
                |--------------------------------------------------------------------------
                */

                foreach ($prepared as $line) {
                    SaleItem::create([
                        'sale_id' =>
                            $sale->id,

                        'product_id' =>
                            $line['product']->id,

                        'quantity' =>
                            $line['quantity'],

                        'size_oz' =>
                            $line['sizeOz'],

                        'unit_price' =>
                            $line['unitPrice'],

                        'subtotal' =>
                            $line['subtotal'],
                    ]);
                }

                /*
                |--------------------------------------------------------------------------
                | Deduct EVERY ingredient
                |--------------------------------------------------------------------------
                */

                foreach (
                    $ingredientDeductions
                    as $ingredientId => $required
                ) {
                    Ingredient::whereKey(
                        $ingredientId
                    )->decrement(
                        'stock',
                        $required
                    );
                }
            });
        } catch (ValidationException $exception) {
            return back()
                ->withErrors(
                    $exception->errors()
                )
                ->with(
                    'error',
                    'Unable to complete order.'
                );
        }

        return back()->with(
            'success',
            'Order completed successfully.'
        );
    }

    private function isMilkTea(
        Product $product
    ): bool {
        $text = strtolower(
            $product->name .
            ' ' .
            $product->category
        );

        return
            str_contains($text, 'milk tea') ||
            str_contains($text, 'matcha') ||
            str_contains($text, 'okinawa') ||
            str_contains($text, 'wintermelon') ||
            str_contains($text, 'chocolate');
    }

    private function generateTransactionNumber(): string
    {
        do {
            $number =
                'TXN-' .
                now()->format('Ymd-His') .
                '-' .
                str_pad(
                    (string) random_int(
                        0,
                        9999
                    ),
                    4,
                    '0',
                    STR_PAD_LEFT
                );
        } while (
            Sale::where(
                'transaction_number',
                $number
            )->exists()
        );

        return $number;
    }

    public function receiptPdf(
        Request $request,
        Sale $sale
    ): SymfonyResponse {
        $user =
            $request->user();

        if (
            ! $user->isOwner() &&
            (int) $sale->branch_id !==
            (int) $user->branch_id
        ) {
            abort(403);
        }

        $sale->load([
            'branch',
            'customer',
            'staff',
            'saleItems.product',
        ]);

        abort_unless(
            $sale->status === 'completed',
            404
        );

        $pdf = Pdf::loadView(
            'pdf.sales-receipt',
            [
                'sale' => $sale,
            ]
        );

        return $pdf->download(
            'receipt-' .
            $sale->transaction_number .
            '.pdf'
        );
    }

    private function presentSale(
        Sale $sale
    ): array {
        return [
            'id' =>
                $sale->id,

            'branch_id' =>
                $sale->branch_id,

            'branch_name' =>
                $sale->branch?->name
                    ? str_replace(
                        'Mabi Sip and Bites ',
                        '',
                        $sale->branch->name
                    )
                    : '',

            'customer_id' =>
                $sale->customer_id,

            'customer_name' =>
                $sale->customer?->name ??
                'Walk-in',

            'staff_id' =>
                $sale->staff_id,

            'staff_name' =>
                $sale->staff?->name ??
                '',

            'transaction_number' =>
                $sale->transaction_number,

            'total_amount' =>
                (float) $sale->total_amount,

            'payment_method' =>
                $sale->payment_method,

            'sale_date' =>
                $sale->sale_date
                    ?->toIso8601String(),

            'status' =>
                $sale->status,

            'items' =>
                $sale->saleItems
                    ->map(
                        fn (SaleItem $item) => [
                            'id' =>
                                $item->id,

                            'product_name' =>
                                $item->product?->name ??
                                'Deleted product',

                            'quantity' =>
                                $item->quantity,

                            'size_oz' =>
                                $item->size_oz,

                            'unit_price' =>
                                (float) $item->unit_price,

                            'subtotal' =>
                                (float) $item->subtotal,
                        ]
                    )
                    ->values(),
        ];
    }
}
