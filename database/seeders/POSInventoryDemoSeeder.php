<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Ingredient;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class POSInventoryDemoSeeder extends Seeder
{
    public function run(): void
    {
        /*
         * This is intended for your current development/testing database.
         * It resets ONLY the new ingredient recipe inventory.
         */

        DB::table('product_ingredients')->delete();
        Ingredient::query()->delete();

        $branches = Branch::query()
            ->where('status', 'active')
            ->get();

        foreach ($branches as $branch) {
            $ingredients = $this->createIngredients($branch->id);

            $products = Product::query()
                ->where('branch_id', $branch->id)
                ->where('status', 'active')
                ->get();

            foreach ($products as $product) {
                $this->configureRecipe(
                    $product,
                    $ingredients
                );
            }
        }

        $this->command?->info(
            'Ingredient inventory and POS recipes created successfully.'
        );
    }

    private function createIngredients(int $branchId)
    {
        $definitions = [
            /*
             * MILK TEA BASES
             *
             * 32 oz intentionally allows you to demonstrate
             * the stock-limit logic easily.
             */
            [
                'name' => 'Classic Milk Tea Powder',
                'category' => 'Milk Tea Base',
                'unit' => 'oz',
                'stock' => 32,
            ],
            [
                'name' => 'Wintermelon Milk Tea Powder',
                'category' => 'Milk Tea Base',
                'unit' => 'oz',
                'stock' => 32,
            ],
            [
                'name' => 'Okinawa Milk Tea Powder',
                'category' => 'Milk Tea Base',
                'unit' => 'oz',
                'stock' => 32,
            ],
            [
                'name' => 'Chocolate Powder',
                'category' => 'Milk Tea Base',
                'unit' => 'oz',
                'stock' => 32,
            ],
            [
                'name' => 'Matcha Powder',
                'category' => 'Milk Tea Base',
                'unit' => 'oz',
                'stock' => 32,
            ],

            /*
             * SHARED DRINK INGREDIENTS
             */
            [
                'name' => 'Black Tea Base',
                'category' => 'Drink Base',
                'unit' => 'oz',
                'stock' => 100,
            ],
            [
                'name' => 'Non-Dairy Creamer',
                'category' => 'Dairy / Creamer',
                'unit' => 'oz',
                'stock' => 100,
            ],
            [
                'name' => 'Brown Sugar Syrup',
                'category' => 'Sweetener',
                'unit' => 'oz',
                'stock' => 100,
            ],
            [
                'name' => 'Chocolate Syrup',
                'category' => 'Sweetener',
                'unit' => 'oz',
                'stock' => 100,
            ],
            [
                'name' => 'Tapioca Pearls',
                'category' => 'Toppings',
                'unit' => 'oz',
                'stock' => 100,
            ],

            /*
             * UNIVERSAL PACKAGING
             */
            [
                'name' => '16 oz Cup',
                'category' => 'Packaging',
                'unit' => 'pcs',
                'stock' => 50,
            ],
            [
                'name' => '18 oz Cup',
                'category' => 'Packaging',
                'unit' => 'pcs',
                'stock' => 50,
            ],
            [
                'name' => '22 oz Cup',
                'category' => 'Packaging',
                'unit' => 'pcs',
                'stock' => 50,
            ],
            [
                'name' => 'Straw',
                'category' => 'Packaging',
                'unit' => 'pcs',
                'stock' => 100,
            ],
            [
                'name' => 'Takeout Bag',
                'category' => 'Packaging',
                'unit' => 'pcs',
                'stock' => 100,
            ],

            /*
             * BURGER
             */
            [
                'name' => 'Burger Bun',
                'category' => 'Burger',
                'unit' => 'pcs',
                'stock' => 30,
            ],
            [
                'name' => 'Burger Patty',
                'category' => 'Burger',
                'unit' => 'pcs',
                'stock' => 30,
            ],
            [
                'name' => 'Burger Cheese',
                'category' => 'Burger',
                'unit' => 'pcs',
                'stock' => 30,
            ],
            [
                'name' => 'Burger Wrapper',
                'category' => 'Packaging',
                'unit' => 'pcs',
                'stock' => 30,
            ],

            /*
             * FRIES
             */
            [
                'name' => 'Frozen French Fries',
                'category' => 'Fries',
                'unit' => 'servings',
                'stock' => 30,
            ],
            [
                'name' => 'Cheese Powder',
                'category' => 'Fries',
                'unit' => 'oz',
                'stock' => 50,
            ],
            [
                'name' => 'Fries Container',
                'category' => 'Packaging',
                'unit' => 'pcs',
                'stock' => 30,
            ],
        ];

        return collect($definitions)
            ->mapWithKeys(function ($definition) use ($branchId) {
                $ingredient = Ingredient::create([
                    'branch_id' => $branchId,
                    'name' => $definition['name'],
                    'category' => $definition['category'],
                    'stock' => $definition['stock'],
                    'unit' => $definition['unit'],
                    'low_stock_threshold' => 10,
                    'cost_price' => null,
                    'status' => 'active',
                ]);

                return [
                    $definition['name'] => $ingredient,
                ];
            });
    }

    private function configureRecipe(
        Product $product,
        $ingredients
    ): void {
        $name = strtolower($product->name);

        /*
         * CLASSIC MILK TEA
         */
        if (str_contains($name, 'classic milk tea')) {
            $this->milkTeaRecipe(
                $product,
                $ingredients,
                'Classic Milk Tea Powder'
            );

            return;
        }

        /*
         * WINTERMELON
         */
        if (str_contains($name, 'wintermelon')) {
            $this->milkTeaRecipe(
                $product,
                $ingredients,
                'Wintermelon Milk Tea Powder'
            );

            return;
        }

        /*
         * OKINAWA
         */
        if (str_contains($name, 'okinawa')) {
            $this->milkTeaRecipe(
                $product,
                $ingredients,
                'Okinawa Milk Tea Powder'
            );

            return;
        }

        /*
         * CHOCOLATE
         */
        if (str_contains($name, 'chocolate')) {
            $this->milkTeaRecipe(
                $product,
                $ingredients,
                'Chocolate Powder',
                true
            );

            return;
        }

        /*
         * MATCHA
         */
        if (str_contains($name, 'matcha')) {
            $this->milkTeaRecipe(
                $product,
                $ingredients,
                'Matcha Powder'
            );

            return;
        }

        /*
         * BURGER
         */
        if (str_contains($name, 'burger')) {
            $this->fixed(
                $product,
                $ingredients,
                'Burger Bun',
                1
            );

            $this->fixed(
                $product,
                $ingredients,
                'Burger Patty',
                1
            );

            $this->fixed(
                $product,
                $ingredients,
                'Burger Cheese',
                1
            );

            $this->fixed(
                $product,
                $ingredients,
                'Burger Wrapper',
                1
            );

            return;
        }

        /*
         * FRIES
         */
        if (str_contains($name, 'fries')) {
            $this->fixed(
                $product,
                $ingredients,
                'Frozen French Fries',
                1
            );

            $this->fixed(
                $product,
                $ingredients,
                'Cheese Powder',
                0.5
            );

            $this->fixed(
                $product,
                $ingredients,
                'Fries Container',
                1
            );
        }
    }

    private function milkTeaRecipe(
        Product $product,
        $ingredients,
        string $powder,
        bool $chocolate = false
    ): void {
        /*
         * DEMO consumption rule:
         *
         * Powder follows the selected drink size so your panel's
         * requested 32 oz stock example is very obvious:
         *
         * 32 / 16 = 2 cups
         * 32 / 18 = 1 cup
         * 32 / 22 = 1 cup
         *
         * You can later replace these numbers with the store's
         * real recipe measurements without changing POS logic.
         */

        $this->sized(
            $product,
            $ingredients,
            $powder,
            16,
            18,
            22
        );

        $this->sized(
            $product,
            $ingredients,
            'Black Tea Base',
            4,
            4.5,
            5.5
        );

        $this->sized(
            $product,
            $ingredients,
            'Non-Dairy Creamer',
            2,
            2.25,
            2.75
        );

        $this->sized(
            $product,
            $ingredients,
            $chocolate
                ? 'Chocolate Syrup'
                : 'Brown Sugar Syrup',
            1,
            1.25,
            1.5
        );

        $this->sized(
            $product,
            $ingredients,
            'Tapioca Pearls',
            2,
            2.25,
            2.75
        );

        /*
         * Cup is size-specific.
         */
        $this->sized(
            $product,
            $ingredients,
            '16 oz Cup',
            1,
            null,
            null
        );

        $this->sized(
            $product,
            $ingredients,
            '18 oz Cup',
            null,
            1,
            null
        );

        $this->sized(
            $product,
            $ingredients,
            '22 oz Cup',
            null,
            null,
            1
        );

        /*
         * Shared universal packaging.
         */
        $this->sized(
            $product,
            $ingredients,
            'Straw',
            1,
            1,
            1
        );

        $this->sized(
            $product,
            $ingredients,
            'Takeout Bag',
            1,
            1,
            1
        );
    }

    private function sized(
        Product $product,
        $ingredients,
        string $ingredientName,
        ?float $size16,
        ?float $size18,
        ?float $size22
    ): void {
        $ingredient =
            $ingredients->get($ingredientName);

        if (! $ingredient) {
            return;
        }

        DB::table('product_ingredients')->insert([
            'product_id' => $product->id,
            'ingredient_id' => $ingredient->id,

            'quantity_16' => $size16,
            'quantity_18' => $size18,
            'quantity_22' => $size22,

            'quantity_per_order' => null,

            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function fixed(
        Product $product,
        $ingredients,
        string $ingredientName,
        float $amount
    ): void {
        $ingredient =
            $ingredients->get($ingredientName);

        if (! $ingredient) {
            return;
        }

        DB::table('product_ingredients')->insert([
            'product_id' => $product->id,
            'ingredient_id' => $ingredient->id,

            'quantity_16' => null,
            'quantity_18' => null,
            'quantity_22' => null,

            'quantity_per_order' => $amount,

            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}