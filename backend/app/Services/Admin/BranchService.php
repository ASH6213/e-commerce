<?php

namespace App\Services\Admin;

use App\Contracts\Repositories\BranchRepositoryInterface;
use App\Models\Branch;
use Illuminate\Database\Eloquent\Collection;

class BranchService
{
    public function __construct(private BranchRepositoryInterface $repository)
    {
    }

    public function getAll(): Collection
    {
        return $this->repository->getAll();
    }

    public function find(int $id): ?Branch
    {
        return $this->repository->findById($id);
    }

    public function create(array $data): Branch
    {
        return $this->repository->create($data);
    }

    public function update(int $id, array $data): bool
    {
        return $this->repository->update($id, $data);
    }

    public function delete(int $id): bool
    {
        return $this->repository->delete($id);
    }
}
