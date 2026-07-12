<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Nullable by design — the POS screen (resources/js/Pages/POS/Index.jsx)
            // falls back to a clean icon placeholder when this is empty, so the
            // feature works immediately without requiring photos to be uploaded
            // for every product first.
            $table->string('image_url')->nullable()->after('selling_price');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('image_url');
        });
    }
};
