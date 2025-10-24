<?php

namespace App\Contracts\Repositories;

use App\Models\Admin;
use Illuminate\Database\Eloquent\Collection;

interface AdminRepositoryInterface
{
    public function findById(int $id): ?Admin;
    
    public function findByEmail(string $email): ?Admin;
    
    public function getAll(): Collection;
    
    public function create(array $data): Admin;
    
    public function update(int $id, array $data): bool;
    
    public function delete(int $id): bool;
    
    public function getActive(): Collection;
}
