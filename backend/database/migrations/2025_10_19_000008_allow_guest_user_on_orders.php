<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Make user_id nullable on orders to support guest checkout
        Schema::table('orders', function (Blueprint $table) {
            // Drop FK to modify column nullability
            try {
                $table->dropForeign(['user_id']);
            } catch (\Throwable $e) {
                // ignore if not present
            }
        });

        // Use raw SQL to avoid requiring doctrine/dbal
        $driver = DB::getDriverName();
        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE orders MODIFY user_id BIGINT UNSIGNED NULL');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL');
        } elseif ($driver === 'sqlite') {
            // SQLite cannot alter column nullability easily; best-effort: leave as-is
        }

        Schema::table('orders', function (Blueprint $table) {
            // Recreate FK allowing nulls (nullOnDelete ensures guest orders persist if user removed)
            try {
                $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            } catch (\Throwable $e) {
                // ignore if it already exists
            }
        });
    }

    public function down(): void
    {
        // Revert to NOT NULL (best-effort). Existing nulls will cause failure; guard accordingly.
        Schema::table('orders', function (Blueprint $table) {
            try {
                $table->dropForeign(['user_id']);
            } catch (\Throwable $e) {}
        });

        $driver = DB::getDriverName();
        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE orders MODIFY user_id BIGINT UNSIGNED NOT NULL');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE orders ALTER COLUMN user_id SET NOT NULL');
        } elseif ($driver === 'sqlite') {
            // skip
        }

        Schema::table('orders', function (Blueprint $table) {
            try {
                $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            } catch (\Throwable $e) {}
        });
    }
};

