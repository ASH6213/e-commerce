<?php

namespace App\Contracts\Repositories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Collection;

interface CategoryRepositoryInterface
{
    public function findById(int $id): ?Category;
    
    public function findBySlug(string $slug): ?Category;
    
    public function getAll(): Collection;
    
    public function create(array $data): Category;
    
    public function update(int $id, array $data): bool;
    
    public function delete(int $id): bool;
    
    public function getActive(): Collection;
    
    public function getWithProductCount(): Collection;
}
