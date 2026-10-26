<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Ingredient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use App\Models\Category;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $selectedBranchId = null;

        $query = Ingredient::query()
            ->where('status', 'active')
            ->with('branch');

        /*
        |--------------------------------------------------------------------------
        | Branch filtering
        |--------------------------------------------------------------------------
        */

        if ($user->isOwner()) {
            $requestedBranch =
                $request->integer('branch_id');

            if ($requestedBranch) {
                $valid = Branch::query()
                    ->whereKey($requestedBranch)
                    ->where('status', 'active')
                    ->exists();

                if ($valid) {
                    $selectedBranchId =
                        $requestedBranch;

                    $query->where(
                        'branch_id',
                        $requestedBranch
                    );
                }
            }
        } else {
            $selectedBranchId =
                $user->branch_id;

            $query->where(
                'branch_id',
                $user->branch_id
            );
        }

        $ingredients = $query
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->map(
                fn (Ingredient $ingredient) =>
                    $this->presentIngredient(
                        $ingredient
                    )
            )
            ->values();

        $categories = Category::query()
            ->where('branch_id', $selectedBranchId ?? -1)
            ->active()
            ->orderBy('name')
            ->with(['products.ingredients'])
            ->get()
            ->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'image_url' => $category->image_url,
                'branch_id' => $category->branch_id,
                'show_in_pos' => $category->show_in_pos,
                'selling_price' => $category->selling_price,
                'recipe' => $category->products->first()?->ingredients->map(fn ($item) => [
                    'ingredient_id' => $item->id,
                    'quantity_per_order' => $item->pivot->quantity_per_order,
                    'quantity_16' => $item->pivot->quantity_16,
                    'quantity_18' => $item->pivot->quantity_18,
                    'quantity_22' => $item->pivot->quantity_22,
                ])->values() ?? [],
            ])
            ->values();

        return Inertia::render('Inventory/Index', [
            'recipeIngredients' => Ingredient::query()->active()->where('branch_id', $selectedBranchId ?? -1)->orderBy('name')->get(['id','name','unit']),
            'ingredients' => $ingredients,

            'categories' => $categories,

            'selectedBranchId' => $selectedBranchId,
        ]);
    }

    public function store(
        Request $request
    ): RedirectResponse {
        $user = $request->user();

        $data = $this->validateIngredient(
            $request
        );

        $branchId = $user->isOwner()
            ? (int) $data['branch_id']
            : (int) $user->branch_id;

        $this->authorizeBranchForUser(
            $user,
            $branchId
        );

        Ingredient::create([
            'branch_id' => $branchId,
            'name' => $data['name'],
            'category' => $data['category'],
            'stock' => $data['stock'],
            'unit' => $data['unit'],
            'low_stock_threshold' =>
                $data['low_stock_threshold'],
            'cost_price' =>
                $data['cost_price'] ?? null,
            'status' => 'active',
        ]);

        return back()->with(
            'success',
            'Ingredient added successfully.'
        );
    }

    public function update(
        Request $request,
        Ingredient $inventory
    ): RedirectResponse {
        $user = $request->user();

        $this->authorizeIngredient(
            $user,
            $inventory
        );

        $data = $this->validateIngredient(
            $request,
            $inventory
        );

        $branchId = $user->isOwner()
            ? (int) $data['branch_id']
            : (int) $user->branch_id;

        $this->authorizeBranchForUser(
            $user,
            $branchId
        );

        $inventory->update([
            'branch_id' => $branchId,
            'name' => $data['name'],
            'category' => $data['category'],
            'stock' => $data['stock'],
            'unit' => $data['unit'],
            'low_stock_threshold' =>
                $data['low_stock_threshold'],
            'cost_price' =>
                $data['cost_price'] ?? null,
        ]);

        return back()->with(
            'success',
            'Ingredient updated successfully.'
        );
    }

    public function addStock(
        Request $request,
        Ingredient $ingredient
    ): RedirectResponse {
        $user = $request->user();

        $this->authorizeIngredient(
            $user,
            $ingredient
        );

        $data = $request->validate([
            'quantity' => [
                'required',
                'numeric',
                'gt:0',
            ],
        ]);

        $ingredient->increment(
            'stock',
            (float) $data['quantity']
        );

        return back()->with(
            'success',
            'Stock added successfully.'
        );
    }

    private function validateIngredient(
        Request $request,
        ?Ingredient $ingredient = null
    ): array {
        $categoryBranch = $request->user()->isOwner()
            ? $request->integer('branch_id')
            : (int) $request->user()->branch_id;
        return $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'category' => [
                'required',
                'string',
                'max:100',
                Rule::exists('categories', 'name')
                    ->where(fn ($query) =>
                        $query->where('status', 'active')->where('branch_id', $categoryBranch)
                    ),
            ],

            'branch_id' => [
                'nullable',
                'integer',
                'exists:branches,id',
            ],

            'stock' => [
                'required',
                'numeric',
                'min:0',
            ],

            'unit' => [
                'required',
                'string',
                'max:50',
            ],

            'low_stock_threshold' => [
                'required',
                'numeric',
                'min:0',
            ],

            'cost_price' => [
                'nullable',
                'numeric',
                'min:0',
            ],
        ]);
    }

    private function authorizeBranchForUser(
        $user,
        int $branchId
    ): void {
        if ($user->isOwner()) {
            return;
        }

        abort_unless(
            (int) $user->branch_id ===
                $branchId,
            403
        );
    }

    private function authorizeIngredient(
        $user,
        Ingredient $ingredient
    ): void {
        if ($user->isOwner()) {
            return;
        }

        abort_unless(
            (int) $ingredient->branch_id ===
                (int) $user->branch_id,
            403
        );
    }

    private function presentIngredient(
        Ingredient $ingredient
    ): array {
        return [
            'id' => $ingredient->id,

            'branch_id' =>
                $ingredient->branch_id,

            'branch_name' =>
                $ingredient->branch?->name
                    ? str_replace(
                        'Mabi Sip and Bites ',
                        '',
                        $ingredient
                            ->branch
                            ->name
                    )
                    : '',

            'name' =>
                $ingredient->name,

            'category' =>
                $ingredient->category,

            'stock' =>
                (float)
                    $ingredient->stock,

            'unit' =>
                $ingredient->unit,

            'low_stock_threshold' =>
                (float)
                    $ingredient
                        ->low_stock_threshold,

            'cost_price' =>
                $ingredient->cost_price !== null
                    ? (float)
                        $ingredient
                            ->cost_price
                    : null,

            'status' =>
                $ingredient->status,
        ];
    }
}