<?php

namespace App\Services\User;

use App\Contracts\Repositories\BranchRepositoryInterface;
use App\Models\Branch;
use Illuminate\Database\Eloquent\Collection;

class BranchService
{
    public function __construct(private BranchRepositoryInterface $repository)
    {
    }

    public function getActive(): Collection
    {
        return $this->repository->getActive();
    }

    public function find(int $id): ?Branch
    {
        return $this->repository->findById($id);
    }

    /**
     * Returns an id for the default branch to use on the storefront
     * when no branch is explicitly selected. Chooses the first active
     * branch by ascending id.
     */
    public function getDefaultBranchId(): ?int
    {
        $active = $this->getActive();
        // Prefer a branch named like "main"
        $preferred = $active->first(function ($b) {
            $n = strtolower(trim((string)($b->name ?? '')));
            return in_array($n, ['main', 'main branch', 'default', 'primary']);
        });
        if ($preferred) {
            return (int) $preferred->id;
        }
        // Fallback to first active by ascending id
        $first = $active->sortBy('id')->values()->first();
        return $first?->id;
    }
}
