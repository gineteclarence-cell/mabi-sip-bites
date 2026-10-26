<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * This migration is resumable with databases where branch_id (or another
     * V2 field) was already created manually or by an earlier patch.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('categories', 'branch_id')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->after('id')->constrained('branches')->cascadeOnDelete();
            });
        }
        if (! Schema::hasColumn('categories', 'show_in_pos')) {
            Schema::table('categories', fn (Blueprint $table) => $table->boolean('show_in_pos')->default(false));
        }
        if (! Schema::hasColumn('categories', 'selling_price')) {
            Schema::table('categories', fn (Blueprint $table) => $table->decimal('selling_price', 10, 2)->nullable());
        }
        if (! Schema::hasColumn('products', 'category_id')) {
            Schema::table('products', fn (Blueprint $table) => $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete());
        }

        // Legacy categories.name had a global unique index, incompatible with
        // identical category names in separate branches.
        $indexes = collect(Schema::getIndexes('categories'));
        if ($indexes->contains(fn ($index) => $index['name'] === 'categories_name_unique')) {
            Schema::table('categories', fn (Blueprint $table) => $table->dropUnique('categories_name_unique'));
        }

        // Clone legacy global categories into each existing branch. Reuse
        // branch-specific rows when already present. Keep the best available
        // category image and preserve existing product/transaction IDs.
        $legacy = DB::table('categories')->whereNull('branch_id')->get()
            ->sortByDesc(fn ($row) => ((($row->status ?? '') === 'active') ? 2 : 0) + (! empty($row->image_path) ? 1 : 0))
            ->groupBy(fn ($row) => mb_strtolower(trim($row->name)))
            ->map(fn ($rows) => $rows->first());

        foreach (DB::table('branches')->pluck('id') as $branchId) {
            foreach ($legacy as $original) {
                $name = trim($original->name);
                $category = DB::table('categories')->where('branch_id', $branchId)
                    ->whereRaw('LOWER(TRIM(name)) = ?', [mb_strtolower($name)])->first();
                $product = DB::table('products')->where('branch_id', $branchId)
                    ->whereRaw('LOWER(TRIM(name)) = ?', [mb_strtolower($name)])->first();
                if (! $category) {
                    $categoryId = DB::table('categories')->insertGetId([
                        'branch_id' => $branchId, 'name' => $name,
                        'image_path' => $original->image_path, 'status' => $original->status,
                        'show_in_pos' => (bool) $product,
                        'selling_price' => $product?->selling_price,
                        'created_at' => now(), 'updated_at' => now(),
                    ]);
                } else {
                    $categoryId = $category->id;
                    if (! $category->image_path && $original->image_path) {
                        DB::table('categories')->where('id', $categoryId)->update(['image_path' => $original->image_path]);
                    }
                    if ($product && ! $category->show_in_pos) {
                        DB::table('categories')->where('id', $categoryId)->update([
                            'show_in_pos' => true, 'selling_price' => $product->selling_price,
                        ]);
                    }
                }
                if ($product) {
                    DB::table('products')->where('id', $product->id)->update(['category_id' => $categoryId]);
                }
            }
        }
        // Don't delete old globals if the database already contains product
        // references to them: preserve them as archived until reconciled.
        $referencedIds = DB::table('products')->whereNotNull('category_id')->pluck('category_id');
        DB::table('categories')->whereNull('branch_id')->whereNotIn('id', $referencedIds)->delete();
        DB::table('categories')->whereNull('branch_id')->whereIn('id', $referencedIds)->update(['status' => 'archived']);

        // Existing databases may contain real duplicate branch rows. Only
        // create the DB unique index when it can succeed; don't destroy data.
        $hasDuplicates = DB::table('categories')
            ->whereNotNull('branch_id')
            ->select('branch_id', 'name')
            ->groupBy('branch_id', 'name')->havingRaw('COUNT(*) > 1')->exists();
        $indexes = collect(Schema::getIndexes('categories'));
        if (! $hasDuplicates && ! $indexes->contains(fn ($index) => $index['name'] === 'categories_branch_id_name_unique')) {
            Schema::table('categories', fn (Blueprint $table) => $table->unique(['branch_id', 'name']));
        }
    }

    public function down(): void
    {
        // Reversing branch ownership would destroy information. Intentionally
        // don't roll back the data conversion automatically.
    }
};
