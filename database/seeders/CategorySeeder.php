<?php
namespace Database\Seeders;
use App\Models\{Branch,Category,Product};
use Illuminate\Database\Seeder;
class CategorySeeder extends Seeder {
    public function run(): void {
        foreach (Branch::all() as $branch) {
            $menuNames = Product::where('branch_id', $branch->id)->pluck('name')->all();
            $names = array_unique(array_merge($menuNames, ['Matcha','Chocolate Milk Tea','General / Shared','Packaging']));
            foreach ($names as $name) {
                $product = Product::where('branch_id', $branch->id)->where('name', $name)->first();
                $category = Category::firstOrCreate(['branch_id' => $branch->id, 'name' => $name], [
                    'status' => 'active', 'show_in_pos' => (bool) $product, 'selling_price' => $product?->selling_price,
                ]);
                if ($product) $product->update(['category_id' => $category->id]);
            }
        }
    }
}
