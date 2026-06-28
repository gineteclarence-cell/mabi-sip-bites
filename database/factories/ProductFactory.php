<?php

namespace Database\Factories;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    public function definition(): array
    {
        $costPrice = fake()->randomFloat(2, 20, 80);

        return [
            'branch_id' => Branch::factory(),
            'name' => fake()->randomElement([
                'Classic Milk Tea', 'Wintermelon Milk Tea', 'Okinawa Milk Tea',
                'Taro Milk Tea', 'Burger', 'Fries', 'Nachos', 'Siomai',
            ]),
            'category' => fake()->randomElement(['Milk Tea', 'Snacks', 'Meals']),
            'sku' => fake()->unique()->bothify('SKU-####??'),
            'unit' => 'pcs',
            'stock' => fake()->numberBetween(5, 100),
            'low_stock_threshold' => 10,
            'cost_price' => $costPrice,
            'selling_price' => $costPrice + fake()->randomFloat(2, 15, 40),
            'status' => 'active',
        ];
    }

    public function lowStock(): static
    {
        return $this->state(fn () => [
            'stock' => fake()->numberBetween(0, 9),
            'low_stock_threshold' => 10,
        ]);
    }

    public function archived(): static
    {
        return $this->state(fn () => [
            'status' => 'archived',
            'archived_at' => now(),
        ]);
    }
}
