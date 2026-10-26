<?php

namespace App\Console\Commands;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class CheckMabiImages extends Command
{
    protected $signature = 'mabi:check-images';
    protected $description = 'Read-only diagnostic of category/POS images and public storage link';

    public function handle(): int
    {
        $disk = Storage::disk('public');
        $this->line('Public disk directory: ' . $disk->path(''));
        $this->line('Public web link: ' . public_path('storage'));
        $this->line('Link exists: ' . (file_exists(public_path('storage')) ? 'yes' : 'NO'));
        $missing = 0;
        foreach ([Category::class, Product::class] as $type) {
            foreach ($type::query()->whereNotNull('image_path')->cursor() as $entry) {
                if (! $disk->exists($entry->image_path)) {
                    $this->warn(class_basename($type) . ' #' . $entry->id . ' missing file: ' . $entry->image_path);
                    $missing++;
                }
            }
        }
        $this->line('Missing files: ' . $missing);
        return self::SUCCESS;
    }
}
