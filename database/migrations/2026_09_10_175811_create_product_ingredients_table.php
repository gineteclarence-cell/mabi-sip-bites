<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_ingredients', function (Blueprint $table) {
            $table->id();

            $table->foreignId('product_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('ingredient_id')
                ->constrained()
                ->cascadeOnDelete();

            /*
             * How much of this ingredient is consumed depending
             * on the selected drink size.
             */
            $table->decimal('quantity_16', 12, 2)->nullable();
            $table->decimal('quantity_18', 12, 2)->nullable();
            $table->decimal('quantity_22', 12, 2)->nullable();

            /*
             * Used by non-sized products such as Burger/Fries.
             */
            $table->decimal('quantity_per_order', 12, 2)->nullable();

            $table->timestamps();

            $table->unique([
                'product_id',
                'ingredient_id',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_ingredients');
    }
};