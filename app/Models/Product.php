<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'category_id',
        'name',
        'category',
        'sku',
        'unit',
        'stock',
        'low_stock_threshold',
        'cost_price',
        'selling_price',
        'image_path',
        'status',
    ];

    protected $appends = [
        'image_url',
    ];

    protected function casts(): array
    {
        return [
            'stock' => 'integer',
            'low_stock_threshold' => 'integer',
            'cost_price' => 'decimal:2',
            'selling_price' => 'decimal:2',
            'archived_at' => 'datetime',
        ];
    }

    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image_path || ! Storage::disk('public')->exists($this->image_path)) {
            return null;
        }

        return Storage::disk('public')->url($this->image_path);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function isLowStock(): bool
    {
        return $this->stock <= $this->low_stock_threshold;
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeArchived($query)
    {
        return $query->where('status', 'archived');
    }

    public function scopeLowStock($query)
    {
        return $query->whereColumn(
            'stock',
            '<=',
            'low_stock_threshold',
        );
    }

    public function ingredients(): BelongsToMany
    {
        return $this->belongsToMany(
            Ingredient::class,
            'product_ingredients'
        )
            ->withPivot([
                'quantity_16',
                'quantity_18',
                'quantity_22',
                'quantity_per_order',
            ])
            ->withTimestamps();
    }
}