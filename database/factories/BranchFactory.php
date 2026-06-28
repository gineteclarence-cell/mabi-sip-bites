<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class BranchFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => 'Mabi Sip & Bites — Branch ' . fake()->unique()->numberBetween(1, 100),
            'location' => fake()->streetAddress(),
            'contact_number' => '09' . fake()->numerify('#########'),
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
