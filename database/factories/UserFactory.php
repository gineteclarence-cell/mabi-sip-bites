<?php

namespace Database\Factories;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * NOTE: This replaces the starter kit's default UserFactory.
 * Merge the `password` default-hashing pattern with your starter kit version
 * if it differs (some versions use Hash::make, others use 'password').
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'branch_id' => Branch::factory(),
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'contact_number' => '09' . fake()->numerify('#########'),
            'role' => 'staff',
            'status' => 'active',
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function owner(): static
    {
        return $this->state(fn () => [
            'role' => 'owner',
            'branch_id' => null,
        ]);
    }

    public function manager(): static
    {
        return $this->state(fn () => [
            'role' => 'manager',
        ]);
    }

    public function staff(): static
    {
        return $this->state(fn () => [
            'role' => 'staff',
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
