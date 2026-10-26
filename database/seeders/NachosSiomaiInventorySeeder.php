<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Ingredient;
use App\Models\Product;
use Illuminate\Database\Seeder;

class NachosSiomaiInventorySeeder extends Seeder
{
    public function run(): void
    {
        $branches = Branch::query()
            ->where('status', 'active')
            ->get();

        foreach ($branches as $branch) {
            /*
            |--------------------------------------------------------------------------
            | NACHOS INGREDIENTS
            |--------------------------------------------------------------------------
            */

            $nachoChips = $this->ingredient(
                branchId: $branch->id,
                category: 'Nachos',
                name: 'Nacho Chips',
                unit: 'servings',
                stock: 30,
                threshold: 5,
                costPrice: 20
            );

            $nachoCheese = $this->ingredient(
                branchId: $branch->id,
                category: 'Nachos',
                name: 'Nacho Cheese Sauce',
                unit: 'oz',
                stock: 60,
                threshold: 10,
                costPrice: 100
            );

            $nachoSalsa = $this->ingredient(
                branchId: $branch->id,
                category: 'Nachos',
                name: 'Salsa',
                unit: 'oz',
                stock: 40,
                threshold: 8,
                costPrice: 80
            );

            /*
            |--------------------------------------------------------------------------
            | SIOMAI INGREDIENTS
            |--------------------------------------------------------------------------
            */

            $siomaiPieces = $this->ingredient(
                branchId: $branch->id,
                category: 'Siomai',
                name: 'Siomai Pieces',
                unit: 'pcs',
                stock: 120,
                threshold: 20,
                costPrice: 150
            );

            $soySauce = $this->ingredient(
                branchId: $branch->id,
                category: 'Siomai',
                name: 'Soy Sauce',
                unit: 'oz',
                stock: 50,
                threshold: 10,
                costPrice: 60
            );

            $chiliGarlic = $this->ingredient(
                branchId: $branch->id,
                category: 'Siomai',
                name: 'Chili Garlic',
                unit: 'oz',
                stock: 40,
                threshold: 8,
                costPrice: 90
            );

            /*
            |--------------------------------------------------------------------------
            | SHARED / PACKAGING INGREDIENTS
            |--------------------------------------------------------------------------
            |
            | These are NOT duplicated under Nachos and Siomai.
            |
            | Both products can consume the same packaging stock.
            |
            */

            $foodContainer = $this->ingredient(
                branchId: $branch->id,
                category: 'Packaging',
                name: 'Food Container',
                unit: 'pcs',
                stock: 60,
                threshold: 10,
                costPrice: 3
            );

            $disposableFork = $this->ingredient(
                branchId: $branch->id,
                category: 'Packaging',
                name: 'Disposable Fork',
                unit: 'pcs',
                stock: 100,
                threshold: 20,
                costPrice: 1
            );

            $takeoutBag = $this->ingredient(
                branchId: $branch->id,
                category: 'Packaging',
                name: 'Takeout Bag',
                unit: 'pcs',
                stock: 100,
                threshold: 20,
                costPrice: 2
            );

            /*
            |--------------------------------------------------------------------------
            | FIND NACHOS PRODUCT
            |--------------------------------------------------------------------------
            */

            $nachos = Product::query()
                ->where('branch_id', $branch->id)
                ->where('status', 'active')
                ->where(function ($query) {
                    $query
                        ->whereRaw(
                            'LOWER(name) LIKE ?',
                            ['%nachos%']
                        )
                        ->orWhereRaw(
                            'LOWER(category) = ?',
                            ['nachos']
                        );
                })
                ->first();

            /*
            |--------------------------------------------------------------------------
            | FIND SIOMAI PRODUCT
            |--------------------------------------------------------------------------
            */

            $siomai = Product::query()
                ->where('branch_id', $branch->id)
                ->where('status', 'active')
                ->where(function ($query) {
                    $query
                        ->whereRaw(
                            'LOWER(name) LIKE ?',
                            ['%siomai%']
                        )
                        ->orWhereRaw(
                            'LOWER(category) = ?',
                            ['siomai']
                        );
                })
                ->first();

            /*
            |--------------------------------------------------------------------------
            | NACHOS RECIPE
            |--------------------------------------------------------------------------
            |
            | 1 Nachos order:
            |
            | Nacho Chips         1 serving
            | Cheese Sauce        2 oz
            | Salsa               1 oz
            | Food Container      1 pc
            | Disposable Fork     1 pc
            | Takeout Bag         1 pc
            |
            */

            if ($nachos) {
                $this->attachFixed(
                    $nachos,
                    $nachoChips,
                    1
                );

                $this->attachFixed(
                    $nachos,
                    $nachoCheese,
                    2
                );

                $this->attachFixed(
                    $nachos,
                    $nachoSalsa,
                    1
                );

                $this->attachFixed(
                    $nachos,
                    $foodContainer,
                    1
                );

                $this->attachFixed(
                    $nachos,
                    $disposableFork,
                    1
                );

                $this->attachFixed(
                    $nachos,
                    $takeoutBag,
                    1
                );

                $this->command?->info(
                    "Nachos recipe configured for {$branch->name}."
                );
            } else {
                $this->command?->warn(
                    "No active Nachos product found for {$branch->name}."
                );
            }

            /*
            |--------------------------------------------------------------------------
            | SIOMAI RECIPE
            |--------------------------------------------------------------------------
            |
            | 1 Siomai order:
            |
            | Siomai Pieces       4 pcs
            | Soy Sauce           0.50 oz
            | Chili Garlic        0.25 oz
            | Food Container      1 pc
            | Disposable Fork     1 pc
            | Takeout Bag         1 pc
            |
            */

            if ($siomai) {
                $this->attachFixed(
                    $siomai,
                    $siomaiPieces,
                    4
                );

                $this->attachFixed(
                    $siomai,
                    $soySauce,
                    0.50
                );

                $this->attachFixed(
                    $siomai,
                    $chiliGarlic,
                    0.25
                );

                $this->attachFixed(
                    $siomai,
                    $foodContainer,
                    1
                );

                $this->attachFixed(
                    $siomai,
                    $disposableFork,
                    1
                );

                $this->attachFixed(
                    $siomai,
                    $takeoutBag,
                    1
                );

                $this->command?->info(
                    "Siomai recipe configured for {$branch->name}."
                );
            } else {
                $this->command?->warn(
                    "No active Siomai product found for {$branch->name}."
                );
            }
        }

        $this->command?->info(
            'Nachos and Siomai ingredients and recipes seeded successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE OR UPDATE INGREDIENT
    |--------------------------------------------------------------------------
    |
    | We use:
    |
    | branch_id + category + name
    |
    | because that matches the unique structure of your ingredients table.
    |
    */

    private function ingredient(
        int $branchId,
        string $category,
        string $name,
        string $unit,
        float $stock,
        float $threshold = 10,
        ?float $costPrice = null
    ): Ingredient {
        return Ingredient::updateOrCreate(
            [
                'branch_id' => $branchId,
                'category' => $category,
                'name' => $name,
            ],
            [
                'stock' => $stock,
                'unit' => $unit,
                'low_stock_threshold' => $threshold,
                'cost_price' => $costPrice,
                'status' => 'active',
                'archived_at' => null,
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | ATTACH FIXED RECIPE INGREDIENT
    |--------------------------------------------------------------------------
    |
    | Used for products that do NOT have 16 / 18 / 22 oz selections.
    |
    */

    private function attachFixed(
        Product $product,
        Ingredient $ingredient,
        float $quantityPerOrder
    ): void {
        $product->ingredients()->syncWithoutDetaching([
            $ingredient->id => [
                'quantity_16' => null,
                'quantity_18' => null,
                'quantity_22' => null,
                'quantity_per_order' => $quantityPerOrder,
            ],
        ]);
    }
}