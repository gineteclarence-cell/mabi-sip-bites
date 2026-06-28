<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->string('name');
            $table->string('category');
            $table->string('sku')->nullable();
            $table->string('unit')->default('pcs');
            $table->integer('stock')->default(0);
            $table->integer('low_stock_threshold')->default(10);
            $table->decimal('cost_price', 10, 2)->default(0);
            $table->decimal('selling_price', 10, 2);
            $table->enum('status', ['active', 'archived'])->default('active');
            $table->timestamps();
            $table->timestamp('archived_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
