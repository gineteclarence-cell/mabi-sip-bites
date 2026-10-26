<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MabiRevisionTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_archive_only_exposes_inventory_and_tasks(): void
    {
        $this->actingAs(User::factory()->staff()->create())
            ->get(route('archive.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Archived/Index')
                ->has('archivedRecords.inventory')
                ->has('archivedRecords.tasks')
                ->missing('archivedRecords.sales')
                ->missing('archivedRecords.staff')
                ->missing('archivedRecords.branches'));
    }

    public function test_owner_archive_only_exposes_branches_and_staff(): void
    {
        $this->actingAs(User::factory()->owner()->create())
            ->get(route('archive.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Archived/Index')
                ->has('archivedRecords.branches')
                ->has('archivedRecords.staff')
                ->missing('archivedRecords.inventory')
                ->missing('archivedRecords.tasks')
                ->missing('archivedRecords.sales'));
    }

    public function test_staff_cannot_access_sales_archive_endpoint(): void
    {
        $this->actingAs(User::factory()->staff()->create())
            ->patch(route('archive.archive', ['module' => 'sales', 'id' => 1]))
            ->assertForbidden();
    }

    public function test_first_clock_in_after_nine_fifteen_marks_staff_late(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-26 09:16:00', 'Asia/Manila'));
        try {
            $staff = User::factory()->staff()->create();
            $this->actingAs($staff)->post(route('attendance.time-in'))->assertRedirect();
            $this->assertDatabaseHas('attendance_logs', [
                'user_id' => $staff->id,
                'status' => 'late',
            ]);
        } finally {
            Carbon::setTestNow();
        }
    }
}
