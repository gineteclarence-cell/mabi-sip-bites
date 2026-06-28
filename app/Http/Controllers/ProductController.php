<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Models\Product;
use App\Traits\BranchScoped;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    use BranchScoped;

    public function index(): Response
    {
        $products = $this->scopeToUserBranch(
            Product::query()->where('status', 'active')->with('branch')
        )
            ->orderBy('name')
            ->get()
            ->map(fn (Product $product) => $this->presentProduct($product));

        return Inertia::render('Inventory/Index', [
            'products' => $products,
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $this->authorizeBranch((int) $request->validated('branch_id'));

        Product::create($request->validated());

        return redirect()->back()->with('success', 'Product created successfully.');
    }

    public function update(StoreProductRequest $request, Product $inventory): RedirectResponse
    {
        $this->authorizeRecordBranch($inventory);
        $this->authorizeBranch((int) $request->validated('branch_id'));

        $inventory->update($request->validated());

        return redirect()->back()->with('success', 'Product updated successfully.');
    }

    private function presentProduct(Product $product): array
    {
        return [
            'id' => $product->id,
            'branch_id' => $product->branch_id,
            'branch_name' => $product->branch?->name ? str_replace('Mabi Sip and Bites ', '', $product->branch->name) : '',
            'name' => $product->name,
            'category' => $product->category,
            'sku' => $product->sku,
            'unit' => $product->unit,
            'stock' => $product->stock,
            'low_stock_threshold' => $product->low_stock_threshold,
            'cost_price' => (float) $product->cost_price,
            'selling_price' => (float) $product->selling_price,
            'status' => $product->status,
        ];
    }
}
