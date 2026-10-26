<?php

namespace Tests\Feature;

use App\Models\{Branch, Category, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CategoryImagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_category_image_upload_can_be_retrieved_for_pos_without_public_storage_symlink(): void
    {
        Storage::fake('public');
        $branch = Branch::create(['name' => 'Image Test Branch', 'location' => 'Test', 'status' => 'active']);
        $this->actingAs(User::factory()->owner()->create());
        $response = $this->post(route('categories.store'), [
            'branch_id' => $branch->id,
            'name' => 'Burger Image Test',
            'show_in_pos' => 1,
            'selling_price' => 99,
            'image' => UploadedFile::fake()->image('burger.jpg'),
        ]);
        $response->assertSessionHasNoErrors();
        $category = Category::where('name', 'Burger Image Test')->firstOrFail();
        $this->assertNotEmpty($category->image_path);
        Storage::disk('public')->assertExists($category->image_path);
        $this->assertStringContainsString('/categories/'.$category->id.'/image', $category->image_url);
        $this->get($category->image_url)->assertOk();
    }

    public function test_staff_cannot_view_another_branch_image(): void
    {
        Storage::fake('public');
        $one = Branch::create(['name' => 'One', 'location' => 'Test', 'status' => 'active']);
        $two = Branch::create(['name' => 'Two', 'location' => 'Test', 'status' => 'active']);
        Storage::disk('public')->put('categories/private.jpg', 'image');
        $category = Category::create(['branch_id' => $two->id, 'name' => 'Private', 'image_path' => 'categories/private.jpg', 'status' => 'active']);
        $this->actingAs(User::factory()->staff()->create(['branch_id' => $one->id]));
        $this->get(route('categories.image', $category))->assertForbidden();
    }
}
