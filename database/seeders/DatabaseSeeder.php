<?php

namespace Database\Seeders;

use App\Models\AttendanceLog;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StaffTask;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // --- Branches -------------------------------------------------
        $branch1 = Branch::create([
            'name' => 'Mabi Sip & Bites — Branch 1',
            'location' => 'Calaca, Batangas',
            'contact_number' => '09171234567',
            'status' => 'active',
        ]);

        $branch2 = Branch::create([
            'name' => 'Mabi Sip & Bites — Branch 2',
            'location' => 'Lemery, Batangas',
            'contact_number' => '09181234567',
            'status' => 'active',
        ]);

        // --- Users ------------------------------------------------------
        $owner = User::factory()->owner()->create([
            'name' => 'Mabel Reyes',
            'email' => 'owner@mabisipbites.test',
            'contact_number' => '09171112222',
        ]);

        $manager1 = User::factory()->manager()->create([
            'name' => 'Carlo Santos',
            'email' => 'manager.branch1@mabisipbites.test',
            'branch_id' => $branch1->id,
            'contact_number' => '09172223333',
        ]);

        $manager2 = User::factory()->manager()->create([
            'name' => 'Diana Cruz',
            'email' => 'manager.branch2@mabisipbites.test',
            'branch_id' => $branch2->id,
            'contact_number' => '09183334444',
        ]);

        $staff1 = User::factory()->staff()->create([
            'name' => 'Jasmine Lopez',
            'email' => 'staff.branch1@mabisipbites.test',
            'branch_id' => $branch1->id,
            'contact_number' => '09174445555',
        ]);

        $staff2 = User::factory()->staff()->create([
            'name' => 'Miguel Torres',
            'email' => 'staff.branch2@mabisipbites.test',
            'branch_id' => $branch2->id,
            'contact_number' => '09185556666',
        ]);

        // --- Products (named, per branch) --------------------------------
        $productNames = [
            ['name' => 'Classic Milk Tea', 'category' => 'Milk Tea', 'cost' => 35, 'price' => 79],
            ['name' => 'Wintermelon Milk Tea', 'category' => 'Milk Tea', 'cost' => 38, 'price' => 85],
            ['name' => 'Okinawa Milk Tea', 'category' => 'Milk Tea', 'cost' => 40, 'price' => 89],
            ['name' => 'Burger', 'category' => 'Meals', 'cost' => 45, 'price' => 99],
            ['name' => 'Fries', 'category' => 'Snacks', 'cost' => 20, 'price' => 55],
            ['name' => 'Nachos', 'category' => 'Snacks', 'cost' => 30, 'price' => 75],
            ['name' => 'Siomai', 'category' => 'Snacks', 'cost' => 18, 'price' => 50],
        ];

        $productsByBranch = [];

        foreach ([$branch1, $branch2] as $branch) {
            $productsByBranch[$branch->id] = [];

            foreach ($productNames as $index => $item) {
                $productsByBranch[$branch->id][] = Product::create([
                    'branch_id' => $branch->id,
                    'name' => $item['name'],
                    'category' => $item['category'],
                    'sku' => 'SKU-' . $branch->id . '-' . str_pad($index + 1, 3, '0', STR_PAD_LEFT),
                    'unit' => 'pcs',
                    'stock' => $index === 0 ? 8 : fake()->numberBetween(15, 80), // first item low-stock
                    'low_stock_threshold' => 10,
                    'cost_price' => $item['cost'],
                    'selling_price' => $item['price'],
                    'status' => 'active',
                ]);
            }
        }

        $this->call(CategorySeeder::class);

        // --- Customers ----------------------------------------------------
        $customersByBranch = [
            $branch1->id => Customer::factory()->count(5)->create(['branch_id' => $branch1->id]),
            $branch2->id => Customer::factory()->count(5)->create(['branch_id' => $branch2->id]),
        ];

        // --- Sales + Sale Items (last 14 days, both branches) --------------
        $branchStaffMap = [
            $branch1->id => $staff1,
            $branch2->id => $staff2,
        ];

        $txnCounter = 1;

        foreach ([$branch1, $branch2] as $branch) {
            $staff = $branchStaffMap[$branch->id];
            $products = $productsByBranch[$branch->id];
            $customers = $customersByBranch[$branch->id];

            for ($i = 0; $i < 15; $i++) {
                $saleDate = Carbon::now()->subDays(fake()->numberBetween(0, 13))
                    ->setTime(fake()->numberBetween(8, 19), fake()->numberBetween(0, 59));

                $sale = Sale::create([
                    'branch_id' => $branch->id,
                    'customer_id' => fake()->boolean(70) ? $customers->random()->id : null,
                    'staff_id' => $staff->id,
                    'transaction_number' => 'TXN-' . now()->format('Ymd') . '-' . str_pad($txnCounter++, 4, '0', STR_PAD_LEFT),
                    'total_amount' => 0, // recalculated below
                    'payment_method' => fake()->randomElement(['cash', 'gcash', 'other']),
                    'sale_date' => $saleDate,
                    'status' => 'completed',
                ]);

                $itemCount = fake()->numberBetween(1, 3);
                $total = 0;

                foreach (fake()->randomElements($products, $itemCount) as $product) {
                    $quantity = fake()->numberBetween(1, 4);
                    $unitPrice = $product->selling_price;
                    $subtotal = $quantity * $unitPrice;
                    $total += $subtotal;

                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => $product->id,
                        'quantity' => $quantity,
                        'unit_price' => $unitPrice,
                        'subtotal' => $subtotal,
                    ]);
                }

                $sale->update(['total_amount' => $total]);
            }
        }

        // --- Attendance Logs (last 7 days, both staff) ----------------------
        foreach ([$staff1, $staff2] as $staffMember) {
            for ($i = 0; $i < 7; $i++) {
                $workDate = Carbon::now()->subDays($i);

                AttendanceLog::create([
                    'user_id' => $staffMember->id,
                    'branch_id' => $staffMember->branch_id,
                    'time_in' => $workDate->copy()->setTime(8, fake()->numberBetween(0, 20)),
                    'time_out' => $workDate->copy()->setTime(17, fake()->numberBetween(0, 30)),
                    'work_date' => $workDate->format('Y-m-d'),
                    'status' => fake()->randomElement(['present', 'present', 'present', 'late']),
                ]);
            }
        }

        // --- Staff Tasks -----------------------------------------------------
        StaffTask::create([
            'branch_id' => $branch1->id,
            'assigned_to' => $staff1->id,
            'assigned_by' => $manager1->id,
            'title' => 'Restock milk tea supplies',
            'description' => 'Check syrup and powder levels before weekend rush.',
            'priority' => 'high',
            'status' => 'pending',
            'due_date' => Carbon::now()->addDays(2)->format('Y-m-d'),
        ]);

        StaffTask::create([
            'branch_id' => $branch1->id,
            'assigned_to' => $staff1->id,
            'assigned_by' => $manager1->id,
            'title' => 'Clean espresso machine',
            'description' => 'Weekly deep clean of the espresso machine.',
            'priority' => 'medium',
            'status' => 'in_progress',
            'due_date' => Carbon::now()->addDays(1)->format('Y-m-d'),
        ]);

        StaffTask::create([
            'branch_id' => $branch2->id,
            'assigned_to' => $staff2->id,
            'assigned_by' => $manager2->id,
            'title' => 'Update price board',
            'description' => 'Reflect new pricing for seasonal drinks.',
            'priority' => 'low',
            'status' => 'pending',
            'due_date' => Carbon::now()->addDays(5)->format('Y-m-d'),
        ]);

        StaffTask::create([
            'branch_id' => $branch2->id,
            'assigned_to' => $staff2->id,
            'assigned_by' => $manager2->id,
            'title' => 'Count daily cash drawer',
            'description' => 'Reconcile cash drawer against POS total.',
            'priority' => 'high',
            'status' => 'completed',
            'due_date' => Carbon::now()->subDays(1)->format('Y-m-d'),
        ]);

        $this->command->info('Mabi Sip & Bites demo data seeded successfully.');
        $this->command->info('Owner login: owner@mabisipbites.test / password');
        $this->command->info('Manager (Branch 1): manager.branch1@mabisipbites.test / password');
        $this->command->info('Manager (Branch 2): manager.branch2@mabisipbites.test / password');
        $this->command->info('Staff (Branch 1): staff.branch1@mabisipbites.test / password');
        $this->command->info('Staff (Branch 2): staff.branch2@mabisipbites.test / password');
    }
}
