<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Storage;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'branch_id',
        'show_in_pos',
        'selling_price',
        'image_path',
        'status',
    ];

    protected function casts(): array
    {
        return ['show_in_pos' => 'boolean', 'selling_price' => 'decimal:2'];
    }

    public function branch() { return $this->belongsTo(\App\Models\Branch::class); }
    public function products() { return $this->hasMany(\App\Models\Product::class); }

    protected $appends = [
        'image_url',
    ];

    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image_path || ! Storage::disk('public')->exists($this->image_path)) {
            return null;
        }

        // Same-origin, authenticated image route avoids APP_URL and Windows public/storage link issues.
        return route('categories.image', ['category' => $this->getKey(), 'v' => $this->updated_at?->timestamp], false);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}