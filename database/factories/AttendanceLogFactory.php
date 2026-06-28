<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AttendanceLogFactory extends Factory
{
    public function definition(): array
    {
        $workDate = fake()->dateTimeBetween('-14 days', 'now');
        $timeIn = (clone $workDate)->setTime(8, fake()->numberBetween(0, 30));
        $timeOut = (clone $workDate)->setTime(17, fake()->numberBetween(0, 30));

        return [
            'user_id' => User::factory()->staff(),
            'branch_id' => Branch::factory(),
            'time_in' => $timeIn,
            'time_out' => $timeOut,
            'work_date' => $workDate->format('Y-m-d'),
            'status' => 'present',
            'remarks' => null,
        ];
    }

    public function late(): static
    {
        return $this->state(fn () => ['status' => 'late']);
    }

    public function absent(): static
    {
        return $this->state(fn () => [
            'status' => 'absent',
            'time_in' => null,
            'time_out' => null,
        ]);
    }

    public function incomplete(): static
    {
        return $this->state(fn () => [
            'status' => 'incomplete',
            'time_out' => null,
        ]);
    }
}
