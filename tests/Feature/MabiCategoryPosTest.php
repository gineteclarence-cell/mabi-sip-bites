<?php
namespace Tests\Feature;

use App\Models\{Branch, Category, Ingredient, Product, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MabiCategoryPosTest extends TestCase
{
    use RefreshDatabase;

    private function branch(string $name): Branch
    {
        return Branch::create(['name' => $name, 'location' => 'Test Location', 'status' => 'active']);
    }

    public function test_categories_are_branch_scoped_and_same_name_can_exist_in_two_branches(): void
    {
        $one = $this->branch('Branch 1');
        $two = $this->branch('Branch 2');
        $this->actingAs(User::factory()->owner()->create());
        foreach ([$one, $two] as $branch) {
            $this->post(route('categories.store'), [
                'name' => 'New Waffle', 'branch_id' => $branch->id,
                'show_in_pos' => 1, 'selling_price' => 99.50,
            ])->assertRedirect();
        }
        $this->assertDatabaseCount('categories', 2);
        $this->assertDatabaseHas('products', ['branch_id' => $one->id, 'name' => 'New Waffle', 'selling_price' => 99.50]);
        $this->assertDatabaseHas('products', ['branch_id' => $two->id, 'name' => 'New Waffle', 'selling_price' => 99.50]);
        $this->get(route('pos.index', ['branch_id' => $one->id]))->assertInertia(fn (Assert $page) => $page
            ->component('POS/Index')->has('productOptions', 1)
            ->where('productOptions.0.name', 'New Waffle')
            ->where('productOptions.0.inventory_configured', false));
    }

    public function test_inventory_only_category_does_not_create_a_pos_product(): void
    {
        $branch = $this->branch('Branch 1');
        $this->actingAs(User::factory()->owner()->create());
        $this->post(route('categories.store'), [
            'branch_id' => $branch->id, 'name' => 'Packaging', 'show_in_pos' => 0,
        ])->assertRedirect();
        $this->assertDatabaseHas('categories', ['branch_id' => $branch->id, 'name' => 'Packaging', 'show_in_pos' => false]);
        $this->assertDatabaseMissing('products', ['branch_id' => $branch->id, 'name' => 'Packaging']);
    }

    public function test_category_archiving_removes_pos_entry_without_deleting_sales_related_product(): void
    {
        $branch = $this->branch('Branch 1');
        $this->actingAs(User::factory()->owner()->create());
        $this->post(route('categories.store'), [
            'branch_id' => $branch->id, 'name' => 'Burger Deluxe', 'show_in_pos' => 1, 'selling_price' => 115,
        ]);
        $category = Category::firstOrFail();
        $product = Product::firstOrFail();
        $this->delete(route('categories.destroy', $category))->assertRedirect();
        $this->assertDatabaseHas('products', ['id' => $product->id, 'status' => 'archived']);
        $this->assertDatabaseHas('categories', ['id' => $category->id, 'status' => 'archived']);
        $this->get(route('pos.index', ['branch_id' => $branch->id]))
            ->assertInertia(fn (Assert $page) => $page->component('POS/Index')->has('productOptions', 0));
    }

    public function test_staff_cannot_modify_categories_of_other_branches(): void
    {
        $one = $this->branch('Branch 1');
        $two = $this->branch('Branch 2');
        $category = Category::create(['branch_id' => $two->id, 'name' => 'Burgers', 'status' => 'active']);
        $staff = User::factory()->staff()->create(['branch_id' => $one->id]);
        $this->actingAs($staff)->delete(route('categories.destroy', $category))->assertForbidden();
        $this->actingAs($staff)->put(route('categories.update', $category), [
            'name' => 'Tampered', 'show_in_pos' => 1, 'selling_price' => 1,
        ])->assertForbidden();
        $this->assertDatabaseHas('categories', ['id' => $category->id, 'name' => 'Burgers', 'status' => 'active']);
    }

    public function test_ingredient_recipe_enables_product_availability(): void
    {
        $branch = $this->branch('Branch 1');
        $ingredient = Ingredient::create([
            'branch_id' => $branch->id, 'name' => 'Patty', 'category' => 'Burger',
            'stock' => 10, 'unit' => 'pcs', 'low_stock_threshold' => 2, 'status' => 'active',
        ]);
        $this->actingAs(User::factory()->owner()->create());
        $this->post(route('categories.store'), [
            'branch_id' => $branch->id, 'name' => 'Burger', 'show_in_pos' => 1, 'selling_price' => 99,
            'recipe' => [['ingredient_id' => $ingredient->id, 'quantity_per_order' => 2]],
        ])->assertRedirect();
        $this->assertDatabaseHas('product_ingredients', ['ingredient_id' => $ingredient->id, 'quantity_per_order' => 2]);
        $this->get(route('pos.index', ['branch_id' => $branch->id]))->assertInertia(fn (Assert $page) => $page
            ->component('POS/Index')->where('productOptions.0.inventory_configured', true)
            ->where('productOptions.0.availability.default.maximum', 5));
    }

    public function test_owner_branch_filter_is_retained_server_side_across_pages(): void
    {
        $one = $this->branch('Branch 1');
        $two = $this->branch('Branch 2');
        $this->actingAs(User::factory()->owner()->create());
        $this->get(route('inventory.index', ['branch_id' => $one->id]))->assertOk();
        $this->get(route('pos.index'))->assertInertia(fn (Assert $page) => $page
            ->component('POS/Index')->where('selectedBranchId', $one->id));
        $this->get(route('pos.index', ['branch_id' => 'all']))->assertInertia(fn (Assert $page) => $page
            ->component('POS/Index')->where('selectedBranchId', null));
    }
}
