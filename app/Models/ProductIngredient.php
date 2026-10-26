<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductIngredient extends Model
{
    protected $fillable = [
        'product_id',
        'ingredient_id',
        'quantity_16',
        'quantity_18',
        'quantity_22',
        'quantity_per_order',
    ];

    protected function casts(): array
    {
        return [
            'quantity_16' => 'decimal:2',
            'quantity_18' => 'decimal:2',
            'quantity_22' => 'decimal:2',
            'quantity_per_order' => 'decimal:2',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }
}