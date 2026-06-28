<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class SaleFactory extends Factory
{
    public function definition(): array
    {
        return [
            'branch_id' => Branch::factory(),
            'customer_id' => Customer::factory(),
            'staff_id' => User::factory()->staff(),
            'transaction_number' => 'TXN-' . fake()->unique()->numerify('######'),
            'total_amount' => fake()->randomFloat(2, 50, 1500),
            'payment_method' => fake()->randomElement(['cash', 'gcash', 'other']),
            'sale_date' => fake()->dateTimeBetween('-30 days', 'now'),
            'status' => 'completed',
        ];
    }

    public function voided(): static
    {
        return $this->state(fn () => ['status' => 'voided']);
    }

    public function archived(): static
    {
        return $this->state(fn () => [
            'status' => 'archived',
            'archived_at' => now(),
        ]);
    }
}
