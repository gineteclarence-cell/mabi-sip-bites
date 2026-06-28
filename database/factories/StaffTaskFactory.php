<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class StaffTaskFactory extends Factory
{
    public function definition(): array
    {
        return [
            'branch_id' => Branch::factory(),
            'assigned_to' => User::factory()->staff(),
            'assigned_by' => User::factory()->manager(),
            'title' => fake()->randomElement([
                'Restock milk tea supplies',
                'Clean espresso machine',
                'Update price board',
                'Count daily cash drawer',
                'Organize storage area',
                'Train new staff on POS',
            ]),
            'description' => fake()->sentence(12),
            'priority' => fake()->randomElement(['low', 'medium', 'high']),
            'status' => fake()->randomElement(['pending', 'in_progress', 'completed']),
            'due_date' => fake()->dateTimeBetween('now', '+14 days')->format('Y-m-d'),
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
