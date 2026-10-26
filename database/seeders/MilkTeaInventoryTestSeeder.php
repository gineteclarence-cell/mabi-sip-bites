<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Ingredient;
use Illuminate\Database\Seeder;

class MilkTeaInventoryTestSeeder extends Seeder
{
    public function run(): void
    {
        $branches = Branch::query()
            ->where('status', 'active')
            ->get();

        foreach ($branches as $branch) {

            /*
            |--------------------------------------------------------------------------
            | CLASSIC MILK TEA
            |--------------------------------------------------------------------------
            |
            | 32 oz intentionally.
            |
            | Expected:
            | 16 oz = maximum 2 cups
            | 18 oz = maximum 1 cup
            | 22 oz = maximum 1 cup
            |
            */
            Ingredient::updateOrCreate(
                [
                    'branch_id' => $branch->id,
                    'category' => 'Classic Milk Tea',
                    'name' => 'Classic Milk Tea Powder',
                ],
                [
                    'stock' => 32,
                    'unit' => 'oz',
                    'low_stock_threshold' => 10,
                    'cost_price' => 100,
                    'status' => 'active',
                ]
            );

            /*
            |--------------------------------------------------------------------------
            | WINTERMELON MILK TEA
            |--------------------------------------------------------------------------
            */
            Ingredient::updateOrCreate(
                [
                    'branch_id' => $branch->id,
                    'category' => 'Wintermelon Milk Tea',
                    'name' => 'Wintermelon Milk Tea Powder',
                ],
                [
                    'stock' => 32,
                    'unit' => 'oz',
                    'low_stock_threshold' => 10,
                    'cost_price' => 100,
                    'status' => 'active',
                ]
            );

            /*
            |--------------------------------------------------------------------------
            | OKINAWA MILK TEA
            |--------------------------------------------------------------------------
            */
            Ingredient::updateOrCreate(
                [
                    'branch_id' => $branch->id,
                    'category' => 'Okinawa Milk Tea',
                    'name' => 'Okinawa Powder / Okinawa Milk Tea Mix',
                ],
                [
                    'stock' => 32,
                    'unit' => 'oz',
                    'low_stock_threshold' => 10,
                    'cost_price' => 120,
                    'status' => 'active',
                ]
            );

            /*
            |--------------------------------------------------------------------------
            | MATCHA
            |--------------------------------------------------------------------------
            */
            Ingredient::updateOrCreate(
                [
                    'branch_id' => $branch->id,
                    'category' => 'Matcha',
                    'name' => 'Matcha Powder',
                ],
                [
                    'stock' => 32,
                    'unit' => 'oz',
                    'low_stock_threshold' => 10,
                    'cost_price' => 150,
                    'status' => 'active',
                ]
            );

            /*
            |--------------------------------------------------------------------------
            | CHOCOLATE MILK TEA
            |--------------------------------------------------------------------------
            */
            Ingredient::updateOrCreate(
                [
                    'branch_id' => $branch->id,
                    'category' => 'Chocolate Milk Tea',
                    'name' => 'Chocolate Powder / Cocoa Powder',
                ],
                [
                    'stock' => 32,
                    'unit' => 'oz',
                    'low_stock_threshold' => 10,
                    'cost_price' => 110,
                    'status' => 'active',
                ]
            );
        }

        $this->command?->info(
            'Milk Tea test inventory seeded: 32 oz per primary powder, per branch.'
        );
    }
}