<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ActivityLogFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'branch_id' => Branch::factory(),
            'action' => fake()->randomElement(['created', 'updated', 'archived', 'restored']),
            'module' => fake()->randomElement(['sales', 'inventory', 'staff', 'attendance', 'tasks']),
            'description' => fake()->sentence(8),
            'metadata' => null,
        ];
    }
}
