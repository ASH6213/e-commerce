<?php

namespace App\DTOs;

abstract class BaseDTO
{
    /**
     * Create DTO from request data
     */
    abstract public static function fromRequest(array $data): self;

    /**
     * Convert DTO to array
     */
    abstract public function toArray(): array;

    /**
     * Create DTO from model
     */
    public static function fromModel($model): self
    {
        return static::fromRequest($model->toArray());
    }

    /**
     * Validate required fields
     */
    protected static function validateRequired(array $data, array $required): void
    {
        foreach ($required as $field) {
            if (!isset($data[$field])) {
                throw new \InvalidArgumentException("Missing required field: {$field}");
            }
        }
    }

    /**
     * Get value with default
     */
    protected static function getValue(array $data, string $key, $default = null)
    {
        return $data[$key] ?? $default;
    }
}
