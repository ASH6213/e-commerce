<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_branch_stocks', function (Blueprint $table) {
            $table->decimal('price_override', 10, 2)->nullable()->after('quantity');
        });
    }

    public function down(): void
    {
        Schema::table('product_branch_stocks', function (Blueprint $table) {
            $table->dropColumn('price_override');
        });
    }
};
