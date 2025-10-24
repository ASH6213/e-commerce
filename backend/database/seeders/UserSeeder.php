<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Default user
        User::updateOrCreate(
            ['email' => 'user@example.com'],
            [
                'name' => 'Default User',
                'password' => Hash::make('password'),
            ]
        );

        // Optional: create additional fake users if factory exists
        if (class_exists(\Database\Factories\UserFactory::class)) {
            User::factory()->count(10)->create();
        }
    }
}
