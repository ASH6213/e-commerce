<?php

namespace App\Services\User;

use App\Contracts\Repositories\CategoryRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class CategoryService
{
    public function __construct(
        protected CategoryRepositoryInterface $categoryRepository
    ) {}

    public function getActiveCategories(): Collection
    {
        return $this->categoryRepository->getActive();
    }
}
