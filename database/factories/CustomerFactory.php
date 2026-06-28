<?php

namespace Database\Factories;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Factories\Factory;

class CustomerFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'contact_number' => '09' . fake()->numerify('#########'),
            'branch_id' => Branch::factory(),
            'status' => 'active',
        ];
    }

    public function archived(): static
    {
        return $this->state(fn () => [
            'status' => 'archived',
            'archived_at' => now(),
        ]);
    }
}
