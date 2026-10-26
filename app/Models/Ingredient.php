<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Ingredient extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'name',
        'category',
        'stock',
        'unit',
        'low_stock_threshold',
        'cost_price',
        'status',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'stock' => 'decimal:2',
            'low_stock_threshold' => 'decimal:2',
            'cost_price' => 'decimal:2',
            'archived_at' => 'datetime',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function isLowStock(): bool
    {
        return (float) $this->stock <=
            (float) $this->low_stock_threshold;
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(
            Product::class,
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