<?php

namespace App\Contracts\Repositories;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Collection;

interface BranchRepositoryInterface
{
    public function findById(int $id): ?Branch;

    public function getAll(): Collection;

    public function getActive(): Collection;

    public function create(array $data): Branch;

    public function update(int $id, array $data): bool;

    public function delete(int $id): bool;
}
