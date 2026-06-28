<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->after('id')->constrained('branches')->nullOnDelete();
            $table->string('contact_number')->nullable()->after('email');
            $table->enum('role', ['owner', 'manager', 'staff'])->default('staff')->after('contact_number');
            $table->enum('status', ['active', 'inactive', 'archived'])->default('active')->after('role');
            $table->timestamp('archived_at')->nullable()->after('updated_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('branch_id');
            $table->dropColumn(['contact_number', 'role', 'status', 'archived_at']);
        });
    }
};
