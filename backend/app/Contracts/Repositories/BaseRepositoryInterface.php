<?php

namespace App\Contracts\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

interface BaseRepositoryInterface
{
    /**
     * Find a record by its ID
     */
    public function findById(int $id): ?Model;

    /**
     * Get all records
     */
    public function getAll(): Collection;

    /**
     * Create a new record
     */
    public function create(array $data): Model;

    /**
     * Update a record by ID
     */
    public function update(int $id, array $data): bool;

    /**
     * Delete a record by ID
     */
    public function delete(int $id): bool;

    /**
     * Find records by specific criteria
     */
    public function findBy(array $criteria): Collection;

    /**
     * Find first record by specific criteria
     */
    public function findOneBy(array $criteria): ?Model;

    /**
     * Check if record exists
     */
    public function exists(int $id): bool;

    /**
     * Count all records
     */
    public function count(): int;

    /**
     * Paginate records
     */
    public function paginate(int $perPage = 15);
}
