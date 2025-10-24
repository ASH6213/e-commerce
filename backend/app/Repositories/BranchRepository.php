<?php

namespace App\Repositories;

use App\Contracts\Repositories\BranchRepositoryInterface;
use App\Models\Branch;
use Illuminate\Database\Eloquent\Collection;

class BranchRepository implements BranchRepositoryInterface
{
    public function __construct(protected Branch $model)
    {}

    public function findById(int $id): ?Branch
    {
        return $this->model->find($id);
    }

    public function getAll(): Collection
    {
        return $this->model->all();
    }

    public function getActive(): Collection
    {
        return $this->model->where('is_active', true)->get();
    }

    public function create(array $data): Branch
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): bool
    {
        $branch = $this->findById($id);
        return $branch ? $branch->update($data) : false;
    }

    public function delete(int $id): bool
    {
        $branch = $this->findById($id);
        return $branch ? $branch->delete() : false;
    }
}
