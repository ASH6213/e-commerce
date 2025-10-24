<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Str;
use Illuminate\Filesystem\Filesystem;

class MakeRepositoryCommand extends Command
{
    protected $signature = 'make:repository {name : The name of the entity (e.g., Brand)}';
    protected $description = 'Create a complete Repository Pattern structure (Interface, Repository, DTO, Service)';

    protected Filesystem $files;

    public function __construct(Filesystem $files)
    {
        parent::__construct();
        $this->files = $files;
    }

    public function handle()
    {
        $name = $this->argument('name');
        $name = Str::studly($name);

        $this->info("Creating Repository Pattern for: {$name}");

        // Create Interface
        $this->createInterface($name);

        // Create Repository
        $this->createRepository($name);

        // Create DTO
        $this->createDTO($name);

        // Create Service
        $this->createService($name);

        // Update RepositoryServiceProvider
        $this->updateServiceProvider($name);

        $this->info("\n✅ Repository Pattern created successfully!");
        $this->info("\n📝 Next steps:");
        $this->info("1. Create Model: php artisan make:model {$name} -m");
        $this->info("2. Edit Migration file");
        $this->info("3. Run migration: php artisan migrate");
        $this->info("4. Create Controller: php artisan make:controller {$name}Controller");
        $this->info("5. Add routes in routes/api.php");
    }

    protected function createInterface($name)
    {
        $path = app_path("Contracts/Repositories/{$name}RepositoryInterface.php");
        
        if ($this->files->exists($path)) {
            $this->warn("Interface already exists: {$path}");
            return;
        }

        $stub = $this->getInterfaceStub($name);
        $this->files->ensureDirectoryExists(dirname($path));
        $this->files->put($path, $stub);
        
        $this->info("✓ Interface created: {$path}");
    }

    protected function createRepository($name)
    {
        $path = app_path("Repositories/{$name}Repository.php");
        
        if ($this->files->exists($path)) {
            $this->warn("Repository already exists: {$path}");
            return;
        }

        $stub = $this->getRepositoryStub($name);
        $this->files->ensureDirectoryExists(dirname($path));
        $this->files->put($path, $stub);
        
        $this->info("✓ Repository created: {$path}");
    }

    protected function createDTO($name)
    {
        $path = app_path("DTOs/{$name}DTO.php");
        
        if ($this->files->exists($path)) {
            $this->warn("DTO already exists: {$path}");
            return;
        }

        $stub = $this->getDTOStub($name);
        $this->files->ensureDirectoryExists(dirname($path));
        $this->files->put($path, $stub);
        
        $this->info("✓ DTO created: {$path}");
    }

    protected function createService($name)
    {
        $path = app_path("Services/{$name}Service.php");
        
        if ($this->files->exists($path)) {
            $this->warn("Service already exists: {$path}");
            return;
        }

        $stub = $this->getServiceStub($name);
        $this->files->ensureDirectoryExists(dirname($path));
        $this->files->put($path, $stub);
        
        $this->info("✓ Service created: {$path}");
    }

    protected function updateServiceProvider($name)
    {
        $path = app_path('Providers/RepositoryServiceProvider.php');
        $content = $this->files->get($path);

        $interface = "App\\Contracts\\Repositories\\{$name}RepositoryInterface";
        $repository = "App\\Repositories\\{$name}Repository";

        // Check if binding already exists
        if (str_contains($content, "{$name}RepositoryInterface")) {
            $this->warn("Binding already exists in RepositoryServiceProvider");
            return;
        }

        // Add use statements
        $useStatements = "use {$interface};\nuse {$repository};";
        $content = str_replace(
            "use App\Repositories\UserRepository;",
            "use App\Repositories\UserRepository;\n{$useStatements}",
            $content
        );

        // Add binding
        $binding = "\n        \$this->app->bind({$name}RepositoryInterface::class, {$name}Repository::class);";
        $content = str_replace(
            "\$this->app->bind(UserRepositoryInterface::class, UserRepository::class);",
            "\$this->app->bind(UserRepositoryInterface::class, UserRepository::class);{$binding}",
            $content
        );

        $this->files->put($path, $content);
        $this->info("✓ RepositoryServiceProvider updated");
    }

    protected function getInterfaceStub($name)
    {
        $nameLower = Str::snake($name);
        
        return <<<PHP
<?php

namespace App\Contracts\Repositories;

use App\Models\\{$name};
use Illuminate\Database\Eloquent\Collection;

interface {$name}RepositoryInterface
{
    public function findById(int \$id): ?{$name};
    
    public function getAll(): Collection;
    
    public function create(array \$data): {$name};
    
    public function update(int \$id, array \$data): bool;
    
    public function delete(int \$id): bool;
    
    public function findBy(array \$criteria): Collection;
    
    public function paginate(int \$perPage = 15);
}

PHP;
    }

    protected function getRepositoryStub($name)
    {
        return <<<PHP
<?php

namespace App\Repositories;

use App\Contracts\Repositories\\{$name}RepositoryInterface;
use App\Models\\{$name};
use Illuminate\Database\Eloquent\Collection;

class {$name}Repository extends BaseRepository implements {$name}RepositoryInterface
{
    public function __construct({$name} \$model)
    {
        parent::__construct(\$model);
    }

    // Add custom methods here
}

PHP;
    }

    protected function getDTOStub($name)
    {
        $nameLower = Str::camel($name);
        
        return <<<PHP
<?php

namespace App\DTOs;

class {$name}DTO extends BaseDTO
{
    public function __construct(
        public readonly string \$name,
        public readonly ?int \$id = null,
    ) {}

    public static function fromRequest(array \$data): self
    {
        return new self(
            name: \$data['name'],
            id: \$data['id'] ?? null,
        );
    }

    public function toArray(): array
    {
        return array_filter([
            'id' => \$this->id,
            'name' => \$this->name,
        ], fn(\$value) => \$value !== null);
    }
}

PHP;
    }

    protected function getServiceStub($name)
    {
        $nameLower = Str::camel($name);
        
        return <<<PHP
<?php

namespace App\Services;

use App\Contracts\Repositories\\{$name}RepositoryInterface;
use App\DTOs\\{$name}DTO;
use App\Models\\{$name};
use Illuminate\Database\Eloquent\Collection;

class {$name}Service
{
    public function __construct(
        private {$name}RepositoryInterface \$repository
    ) {}

    public function create({$name}DTO \$dto): {$name}
    {
        return \$this->repository->create(\$dto->toArray());
    }

    public function update(int \$id, {$name}DTO \$dto): bool
    {
        return \$this->repository->update(\$id, \$dto->toArray());
    }

    public function delete(int \$id): bool
    {
        return \$this->repository->delete(\$id);
    }

    public function getById(int \$id): ?{$name}
    {
        return \$this->repository->findById(\$id);
    }

    public function getAll(): Collection
    {
        return \$this->repository->getAll();
    }

    public function paginate(int \$perPage = 15)
    {
        return \$this->repository->paginate(\$perPage);
    }
}

PHP;
    }
}
