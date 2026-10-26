<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();

            $table->foreignId('branch_id')
                ->constrained('branches')
                ->cascadeOnDelete();

            $table->string('name');
            $table->string('category');

            $table->decimal('stock', 12, 2)->default(0);

            $table->string('unit')->default('pcs');

            $table->decimal('low_stock_threshold', 12, 2)
                ->default(10);

            $table->decimal('cost_price', 10, 2)
                ->nullable();

            $table->enum('status', [
                'active',
                'archived',
            ])->default('active');

            $table->timestamp('archived_at')->nullable();

            $table->timestamps();

            /*
             * Same ingredient name may exist in different categories,
             * but cannot be duplicated inside the same branch + category.
             */
            $table->unique([
                'branch_id',
                'category',
                'name',
            ], 'ingredients_branch_category_name_unique');
        });

        $ingredients = [

            /*
            |--------------------------------------------------------------------------
            | MATCHA
            |--------------------------------------------------------------------------
            */
            [
                'category' => 'Matcha',
                'name' => 'Matcha Powder',
                'unit' => 'oz',
            ],
            [
                'category' => 'Matcha',
                'name' => 'Simple Syrup / Brown Sugar Syrup',
                'unit' => 'oz',
            ],
            [
                'category' => 'Matcha',
                'name' => 'Non-Dairy Creamer / Milk Powder',
                'unit' => 'oz',
            ],
            [
                'category' => 'Matcha',
                'name' => 'Tapioca Pearls (Boba)',
                'unit' => 'oz',
            ],
            [
                'category' => 'Matcha',
                'name' => 'Grass Jelly / Red Bean',
                'unit' => 'oz',
            ],
            [
                'category' => 'Matcha',
                'name' => 'Cream Cheese / Salted Cream Puff Powder',
                'unit' => 'oz',
            ],
            [
                'category' => 'Matcha',
                'name' => 'Plastic Cups & Lids / Sealing Film',
                'unit' => 'pcs',
            ],
            [
                'category' => 'Matcha',
                'name' => 'Straws',
                'unit' => 'pcs',
            ],

            /*
            |--------------------------------------------------------------------------
            | OKINAWA MILK TEA
            |--------------------------------------------------------------------------
            */
            [
                'category' => 'Okinawa Milk Tea',
                'name' => 'Okinawa Powder / Okinawa Milk Tea Mix',
                'unit' => 'oz',
            ],
            [
                'category' => 'Okinawa Milk Tea',
                'name' => 'Black Tea Base',
                'unit' => 'oz',
            ],
            [
                'category' => 'Okinawa Milk Tea',
                'name' => 'Non-Dairy Creamer',
                'unit' => 'oz',
            ],
            [
                'category' => 'Okinawa Milk Tea',
                'name' => 'Fructose / Brown Sugar Syrup',
                'unit' => 'oz',
            ],
            [
                'category' => 'Okinawa Milk Tea',
                'name' => 'Tapioca Pearls (Boba)',
                'unit' => 'oz',
            ],

            /*
            |--------------------------------------------------------------------------
            | CHOCOLATE MILK TEA
            |--------------------------------------------------------------------------
            */
            [
                'category' => 'Chocolate Milk Tea',
                'name' => 'Chocolate Powder / Cocoa Powder',
                'unit' => 'oz',
            ],
            [
                'category' => 'Chocolate Milk Tea',
                'name' => 'Black Tea Base: Brewed Black Tea',
                'unit' => 'oz',
            ],
            [
                'category' => 'Chocolate Milk Tea',
                'name' => 'Non-Dairy Creamer / Condensed Milk',
                'unit' => 'oz',
            ],
            [
                'category' => 'Chocolate Milk Tea',
                'name' => 'Fructose Syrup / Chocolate Syrup',
                'unit' => 'oz',
            ],
            [
                'category' => 'Chocolate Milk Tea',
                'name' => 'Pearl / Egg Pudding / Choco Cookies / Cream Cheese',
                'unit' => 'oz',
            ],
            [
                'category' => 'Chocolate Milk Tea',
                'name' => 'Plastic Cups / Lids / Sealing Film',
                'unit' => 'pcs',
            ],
            [
                'category' => 'Chocolate Milk Tea',
                'name' => 'Straws',
                'unit' => 'pcs',
            ],
            [
                'category' => 'Chocolate Milk Tea',
                'name' => 'Takeout Bags',
                'unit' => 'pcs',
            ],

            /*
            |--------------------------------------------------------------------------
            | BURGER
            |--------------------------------------------------------------------------
            */
            [
                'category' => 'Burger',
                'name' => 'Burger Buns',
                'unit' => 'pcs',
            ],
            [
                'category' => 'Burger',
                'name' => 'Burger Patties',
                'unit' => 'pcs',
            ],
            [
                'category' => 'Burger',
                'name' => 'Cheese',
                'unit' => 'pcs',
            ],
            [
                'category' => 'Burger',
                'name' => 'Lettuce / Tomato / Onion',
                'unit' => 'pcs',
            ],
            [
                'category' => 'Burger',
                'name' => 'Mayonnaise / Ketchup / Mustard',
                'unit' => 'pcs',
            ],
            [
                'category' => 'Burger',
                'name' => 'Burger Wrapper / Burger Box',
                'unit' => 'pcs',
            ],
            [
                'category' => 'Burger',
                'name' => 'Paper Bowl / Plate / Fork / Takeout Bag',
                'unit' => 'pcs',
            ],

            /*
            |--------------------------------------------------------------------------
            | FRIES
            |--------------------------------------------------------------------------
            */
            [
                'category' => 'Fries',
                'name' => 'Frozen French Fries',
                'unit' => 'servings',
            ],
            [
                'category' => 'Fries',
                'name' => 'Cheese Powder',
                'unit' => 'oz',
            ],
            [
                'category' => 'Fries',
                'name' => 'Cooking Oil',
                'unit' => 'oz',
            ],
            [
                'category' => 'Fries',
                'name' => 'Cheese Sauce / Mayonnaise / Ketchup',
                'unit' => 'oz',
            ],
            [
                'category' => 'Fries',
                'name' => 'Fries Pouch / Tub / Cup / Skewer',
                'unit' => 'pcs',
            ],
        ];

        $branchIds = DB::table('branches')
            ->pluck('id');

        $now = now();

        foreach ($branchIds as $branchId) {
            foreach ($ingredients as $ingredient) {
                DB::table('ingredients')->insert([
                    'branch_id' => $branchId,
                    'name' => $ingredient['name'],
                    'category' => $ingredient['category'],
                    'stock' => 0,
                    'unit' => $ingredient['unit'],
                    'low_stock_threshold' => 10,
                    'cost_price' => null,
                    'status' => 'active',
                    'archived_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredients');
    }
};