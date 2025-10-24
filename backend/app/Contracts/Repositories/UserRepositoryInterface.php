<?php

namespace App\Contracts\Repositories;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface UserRepositoryInterface
{
    public function findById(int $id): ?User;
    
    public function findByEmail(string $email): ?User;
    
    public function getAll(): Collection;
    
    public function paginate(int $perPage = 15): LengthAwarePaginator;
    
    public function create(array $data): User;
    
    public function update(int $id, array $data): bool;
    
    public function delete(int $id): bool;
    
    public function search(string $query): Collection;
    
    public function getWithOrderStats(): Collection;
}
