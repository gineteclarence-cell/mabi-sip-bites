<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\Ingredient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    private function branchId(Request $request): int
    {
        $user = $request->user();
        $branchId = $user->isOwner() ? (int) $request->input('branch_id') : (int) $user->branch_id;
        abort_unless($branchId && Branch::whereKey($branchId)->where('status', 'active')->exists(), 422, 'Choose an active branch.');
        return $branchId;
    }

    private function authorizeCategory(Request $request, Category $category): void
    {
        abort_unless($request->user()->isOwner() || (int) $category->branch_id === (int) $request->user()->branch_id, 403);
    }

    private function validateData(Request $request, int $branchId, ?Category $category = null): array
    {
        return $request->validate([
            'name' => ['required','string','max:100', Rule::unique('categories', 'name')->where('branch_id', $branchId)->where('status', 'active')->ignore($category?->id)],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'show_in_pos' => ['required', 'boolean'],
            'recipe' => ['nullable','array'],
            'recipe.*.ingredient_id' => ['required','integer',Rule::exists('ingredients', 'id')->where('branch_id', $branchId)->where('status','active')],
            'recipe.*.quantity_per_order' => ['nullable','numeric','min:0'],
            'recipe.*.quantity_16' => ['nullable','numeric','min:0'],
            'recipe.*.quantity_18' => ['nullable','numeric','min:0'],
            'recipe.*.quantity_22' => ['nullable','numeric','min:0'],
            'selling_price' => ['nullable', 'required_if:show_in_pos,1', 'numeric', 'min:0'],
        ]);
    }

    /** Serve category images from the configured public disk without relying on web-server symlinks. */
    public function image(Request $request, Category $category)
    {
        $this->authorizeCategory($request, $category);
        if (! $category->image_path || ! Storage::disk('public')->exists($category->image_path)) {
            abort(404);
        }

        return Storage::disk('public')->response($category->image_path, null, [
            'Cache-Control' => 'private, max-age=300',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $branchId = $this->branchId($request);
        $data = $this->validateData($request, $branchId);
        // Reuse a previously archived entry rather than violating branch/name uniqueness.
        DB::transaction(function () use ($request, $data, $branchId) {
            $existing = Category::where('branch_id', $branchId)->where('name', $data['name'])->first();
            $path = $request->hasFile('image') ? $request->file('image')->store('categories', 'public') : ($existing?->image_path);
            $category = Category::updateOrCreate(['branch_id' => $branchId, 'name' => $data['name']], [
                'image_path' => $path, 'status' => 'active',
                'show_in_pos' => (bool) $data['show_in_pos'],
                'selling_price' => $data['show_in_pos'] ? $data['selling_price'] : null,
            ]);
            $this->syncPos($category, $data['recipe'] ?? null);
        });
        return back()->with('success', 'Category saved for the selected branch.');
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        $this->authorizeCategory($request, $category);
        $branchId = (int) $category->branch_id;
        $data = $this->validateData($request, $branchId, $category);
        $oldPath = $category->image_path;
        $oldName = $category->name;
        $path = $request->hasFile('image') ? $request->file('image')->store('categories', 'public') : $oldPath;
        DB::transaction(function () use ($category, $data, $path, $oldName) {
            $category->update([
                'name' => $data['name'], 'image_path' => $path,
                'show_in_pos' => (bool) $data['show_in_pos'],
                'selling_price' => $data['show_in_pos'] ? $data['selling_price'] : null,
            ]);
            if ($oldName !== $category->name) {
                Ingredient::where('branch_id', $category->branch_id)->where('category', $oldName)
                    ->update(['category' => $category->name]);
            }
            $this->syncPos($category, $data['recipe'] ?? null);
        });
        if ($path !== $oldPath && $oldPath && ! Category::where('image_path', $oldPath)->exists()) Storage::disk('public')->delete($oldPath);
        return back()->with('success', 'Category and its POS item updated.');
    }

    public function destroy(Request $request, Category $category): RedirectResponse
    {
        $this->authorizeCategory($request, $category);
        DB::transaction(function () use ($category) {
            $category->update(['status' => 'archived']);
            $category->products()->where('status', 'active')->update(['status' => 'archived', 'archived_at' => now()]);
        });
        // Archive instead of hard-delete: sale history must retain the product FK.
        return back()->with('success', 'Category removed from this branch and its POS.');
    }

    private function syncPos(Category $category, ?array $recipe = null): void
    {
        $product = Product::where('category_id', $category->id)->first();
        // Existing seeded menu items can be linked to the newly managed category.
        $product ??= Product::where('branch_id', $category->branch_id)
            ->where('name', $category->name)->whereNull('category_id')->first();
        if (! $category->show_in_pos) {
            if ($product) $product->update(['category_id' => $category->id, 'status' => 'archived', 'archived_at' => now()]);
            return;
        }
        $values = [
            'branch_id' => $category->branch_id, 'category_id' => $category->id,
            'name' => $category->name, 'category' => $category->name,
            'selling_price' => $category->selling_price, 'status' => 'active', 'archived_at' => null,
        ];
        if ($product) $product->update($values);
        else $product = Product::create($values + ['unit' => 'pcs', 'stock' => 0, 'low_stock_threshold' => 0, 'cost_price' => 0]);
        if ($recipe !== null) {
            $sync = [];
            foreach ($recipe as $line) {
                $required = collect(['quantity_per_order','quantity_16','quantity_18','quantity_22'])
                    ->mapWithKeys(fn ($field) => [$field => $line[$field] ?? null])->all();
                if (collect($required)->contains(fn ($value) => $value !== null && (float) $value > 0)) $sync[$line['ingredient_id']] = $required;
            }
            $product->ingredients()->sync($sync);
        }
        // No recipe means unavailable, preventing sales without validated inventory deduction.
    }
}
