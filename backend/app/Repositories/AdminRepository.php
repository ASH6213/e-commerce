<?php

namespace App\Repositories;

use App\Contracts\Repositories\AdminRepositoryInterface;
use App\Models\Admin;
use Illuminate\Database\Eloquent\Collection;

class AdminRepository implements AdminRepositoryInterface
{
    public function __construct(
        protected Admin $model
    ) {}

    public function findById(int $id): ?Admin
    {
        return $this->model->find($id);
    }

    public function findByEmail(string $email): ?Admin
    {
        return $this->model->where('email', $email)->first();
    }

    public function getAll(): Collection
    {
        return $this->model->all();
    }

    public function create(array $data): Admin
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): bool
    {
        $admin = $this->findById($id);
        return $admin ? $admin->update($data) : false;
    }

    public function delete(int $id): bool
    {
        $admin = $this->findById($id);
        return $admin ? $admin->delete() : false;
    }

    public function getActive(): Collection
    {
        return $this->model->where('is_active', true)->get();
    }
}
