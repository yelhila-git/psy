# Laravel API — Milestone 1 (auth + profiles) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Laravel REST API that replaces the frontend's mock repositories for authentication and profiles, and connect the Next.js frontend to it for real.

**Architecture:** A separate Laravel 12 repository exposing a token-authenticated REST API. Identity lives in one `users` table; role-specific data lives in 1-1 profile tables. Every response is shaped by an explicit API Resource so the JSON matches `src/types/index.ts` key for key. Requests are snake_case, responses are camelCase.

**Tech Stack:** PHP 8.2.22, Laravel 12, Sanctum (personal access tokens), MySQL 5.7.33, Pest 3, Composer 2.5.5.

**Spec:** `docs/superpowers/specs/2026-08-19-laravel-api-design.md` (in the frontend repo, `C:\laragon\www\allomonpsy`)

## Global Constraints

- **Backend repo path:** `C:\laragon\www\allomonpsy-api`. The frontend repo stays at `C:\laragon\www\allomonpsy`.
- **Composer is not on PATH.** Always invoke it as `php C:\laragon\bin\composer\composer.phar`.
- **Dev database:** `psyapi`, MySQL 5.7.33 on localhost, user `root`, empty password.
- **Test database:** `psyapi_testing` — separate, because `RefreshDatabase` truncates everything it touches.
- **Charset:** `utf8mb4` / `utf8mb4_unicode_ci` everywhere. Arabic must be storable.
- **`Schema::defaultStringLength(191)`** is mandatory on MySQL 5.7 + utf8mb4, or unique string indexes fail to migrate.
- **Money is an integer in centimes**, paired with an ISO currency code. Never a float, never a decimal column.
- **IDs are strings over JSON.** Every Resource casts `(string) $this->id`.
- **Request bodies are snake_case. Response bodies are camelCase.**
- **Pagination envelope is `{ data, meta: { total, page, perPage, lastPage } }`** — camelCase, and `page`, not Laravel's `current_page`.
- **Enum values are copied verbatim from TypeScript**, including `self-esteem` (hyphen), `ary` and `ber`.
- **The public psychologist route resolves a slug, never an id.**
- MySQL client for manual checks: `C:\laragon\bin\mysql\mysql-5.7.33-winx64\bin\mysql.exe -u root`.

---

## File structure

**Backend — `C:\laragon\www\allomonpsy-api`**

| File | Responsibility |
| --- | --- |
| `app/Models/User.php` | Identity, auth, role, `fullName` accessor |
| `app/Models/PatientProfile.php` | Patient-only fields, favourites relation |
| `app/Models/PsychologistProfile.php` | Practitioner fields, taxonomies, sub-resources |
| `app/Models/Education.php`, `Experience.php` | Practitioner sub-resources |
| `app/Models/AvailabilityRule.php`, `TimeRange.php` | Weekly availability |
| `app/Http/Resources/UserResource.php` | The `BaseUser` fields, reused by both profiles |
| `app/Http/Resources/PatientResource.php` | `Patient` payload |
| `app/Http/Resources/PsychologistResource.php` | `Psychologist` payload |
| `app/Http/Resources/PaginatedCollection.php` | The `{ data, meta }` envelope |
| `app/Http/Requests/RegisterRequest.php`, `LoginRequest.php` | Input validation, snake_case |
| `app/Http/Requests/PsychologistIndexRequest.php` | Marketplace filter validation |
| `app/Http/Controllers/Api/AuthController.php` | register, login, logout, me |
| `app/Http/Controllers/Api/PsychologistController.php` | index, show |
| `app/Queries/PsychologistQuery.php` | Filtering and sorting, isolated from the controller |
| `database/migrations/*` | Schema |
| `database/factories/*`, `database/seeders/*` | Test and demo data |
| `tests/Feature/*` | One file per endpoint |
| `tests/Unit/ResourceContractTest.php` | The key-by-key contract guard |

`PsychologistQuery` is deliberately its own file: eleven filters plus five sorts in a controller method is the kind of thing that becomes unreviewable, and it is the piece most likely to be extended by the appointments slice.

**Frontend — `C:\laragon\www\allomonpsy`**

| File | Change |
| --- | --- |
| `src/lib/services/auth-service.ts` | Create — login, logout, register, me |
| `src/lib/services/index.ts` | Export `authService` |
| `src/lib/services/psychologist-service.ts:243,252` | Map payload to snake_case |
| `src/app/(auth)/login/page.tsx` | Replace the stubbed role selector with a real login |
| `src/app/dashboard/psychologist/{layout,page,profile/page,availability/page}.tsx` | Own-profile reads move to `/me` |
| `.env.local` | `NEXT_PUBLIC_API_URL` |

---

## Task 1: Project bootstrap, database, CORS

**Files:**
- Create: `C:\laragon\www\allomonpsy-api\` (whole project)
- Modify: `app/Providers/AppServiceProvider.php`, `.env`, `.env.testing`, `config/cors.php`, `phpunit.xml`
- Test: `tests/Feature/HealthTest.php`

**Interfaces:**
- Consumes: nothing.
- Produces: a booting Laravel 12 app on `http://127.0.0.1:8000`, routes prefixed `/api`, Sanctum installed, Pest runnable via `php artisan test`.

> **Note:** CORS is not in the spec — it was found while planning. Without it the browser blocks every call from `localhost:3000`. Add it to the spec's environment section when convenient.

- [x] **Step 1: Create the project**

```bash
cd C:/laragon/www
php C:/laragon/bin/composer/composer.phar create-project laravel/laravel allomonpsy-api
cd allomonpsy-api
php artisan --version   # expect: Laravel Framework 12.x
```

- [x] **Step 2: Convert the databases to utf8mb4 and create the test database**

```bash
MYSQL="C:/laragon/bin/mysql/mysql-5.7.33-winx64/bin/mysql.exe"
"$MYSQL" -u root -e "ALTER DATABASE psyapi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
"$MYSQL" -u root -e "CREATE DATABASE IF NOT EXISTS psyapi_testing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
"$MYSQL" -u root -e "SELECT schema_name, default_character_set_name FROM information_schema.schemata WHERE schema_name LIKE 'psyapi%';"
```

Expected: both rows show `utf8mb4`.

- [x] **Step 3: Configure `.env`**

```ini
APP_URL=http://127.0.0.1:8000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=psyapi
DB_USERNAME=root
DB_PASSWORD=
FRONTEND_URL=http://localhost:3000
```

Create `.env.testing` as a copy with `DB_DATABASE=psyapi_testing`.

- [x] **Step 4: Install the API layer and Pest**

```bash
php artisan install:api          # installs Sanctum, creates routes/api.php
php C:/laragon/bin/composer/composer.phar require pestphp/pest pestphp/pest-plugin-laravel --dev --with-all-dependencies
php ./vendor/bin/pest --init
```

- [x] **Step 5: Set the string length and publish CORS config**

`app/Providers/AppServiceProvider.php`:

```php
use Illuminate\Support\Facades\Schema;

public function boot(): void
{
    // MySQL 5.7 + utf8mb4: the 767-byte index prefix caps a unique
    // VARCHAR index at 191 characters.
    Schema::defaultStringLength(191);
}
```

```bash
php artisan config:publish cors
```

`config/cors.php`:

```php
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3000')],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
```

`supports_credentials` stays false: authentication is a Bearer token, not a cookie.

- [x] **Step 6: Point tests at the test database**

In `phpunit.xml`, inside `<php>`:

```xml
<env name="DB_DATABASE" value="psyapi_testing"/>
```

Do **not** use sqlite here. The marketplace sort relies on MySQL's `LOG10()` and the schema uses `enum` columns; sqlite would pass tests that MySQL fails.

- [x] **Step 7: Write the failing health test**

`tests/Feature/HealthTest.php`:

```php
<?php

it('answers on the api health route', function () {
    $this->getJson('/api/health')
        ->assertOk()
        ->assertJson(['status' => 'ok']);
});
```

- [x] **Step 8: Run it to verify it fails**

```bash
php artisan test --filter=health
```

Expected: FAIL — 404, the route does not exist.

- [x] **Step 9: Add the route**

`routes/api.php`:

```php
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => ['status' => 'ok']);
```

- [x] **Step 10: Run it to verify it passes**

```bash
php artisan test --filter=health
```

Expected: PASS.

- [x] **Step 11: Commit**

```bash
cd C:/laragon/www/allomonpsy-api
git init
git add -A
git commit -m "chore: bootstrap Laravel 12 API with Sanctum, Pest, CORS and utf8mb4"
```

---

## Task 2: `users` table and User model

**Files:**
- Modify: `database/migrations/0001_01_01_000000_create_users_table.php`
- Modify: `app/Models/User.php`
- Modify: `database/factories/UserFactory.php`
- Test: `tests/Feature/UserModelTest.php`

**Interfaces:**
- Consumes: Task 1's bootstrap.
- Produces: `User` model with `HasApiTokens`, a `role` enum (`patient|psychologist|admin`), and a `fullName` accessor exposed as `$user->full_name`. `UserFactory` with `->patient()`, `->psychologist()` and `->admin()` states.

- [x] **Step 1: Write the failing test**

`tests/Feature/UserModelTest.php`:

```php
<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('builds a full name from the two name columns', function () {
    $user = User::factory()->patient()->create([
        'first_name' => 'Yasmine',
        'last_name' => 'Ouhadi',
    ]);

    expect($user->full_name)->toBe('Yasmine Ouhadi');
});

it('stores the role and hides the password', function () {
    $user = User::factory()->psychologist()->create();

    expect($user->role)->toBe('psychologist')
        ->and($user->toArray())->not->toHaveKey('password');
});

it('accepts arabic text in the name columns', function () {
    $user = User::factory()->patient()->create(['first_name' => 'ياسمين']);

    expect($user->fresh()->first_name)->toBe('ياسمين');
});
```

The Arabic test is the one that proves the utf8mb4 conversion actually took.

- [x] **Step 2: Run it to verify it fails**

```bash
php artisan test --filter=UserModelTest
```

Expected: FAIL — unknown column `first_name`, and `patient()` is not a factory state.

- [x] **Step 3: Rewrite the users migration**

`database/migrations/0001_01_01_000000_create_users_table.php`, `up()` — replace the `users` table block only, leaving `password_reset_tokens` and `sessions` untouched:

```php
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->enum('role', ['patient', 'psychologist', 'admin']);
    $table->string('first_name', 100);
    $table->string('last_name', 100);
    $table->string('email')->unique();
    // Nullable so an admin can be seeded without one; the register
    // requests make it mandatory for patients and psychologists.
    $table->string('phone', 30)->nullable();
    $table->string('password');
    $table->string('avatar_url')->nullable();
    $table->enum('locale', ['fr', 'ar', 'ary', 'en', 'es', 'ber'])->default('fr');
    $table->timestamp('email_verified_at')->nullable();
    $table->rememberToken();
    $table->timestamps();

    $table->index('role');
});
```

- [x] **Step 4: Write the User model**

`app/Models/User.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'role', 'first_name', 'last_name', 'email',
        'phone', 'password', 'avatar_url', 'locale',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    protected function fullName(): Attribute
    {
        return Attribute::get(fn () => trim("{$this->first_name} {$this->last_name}"));
    }

    public function patientProfile(): HasOne
    {
        return $this->hasOne(PatientProfile::class);
    }

    public function psychologistProfile(): HasOne
    {
        return $this->hasOne(PsychologistProfile::class);
    }
}
```

- [x] **Step 5: Write the factory**

`database/factories/UserFactory.php`:

```php
<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'role' => 'patient',
            'first_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => '+212 6 12 34 56 78',
            'password' => Hash::make('password'),
            'avatar_url' => null,
            'locale' => 'fr',
        ];
    }

    public function patient(): static
    {
        return $this->state(fn () => ['role' => 'patient']);
    }

    public function psychologist(): static
    {
        return $this->state(fn () => ['role' => 'psychologist']);
    }

    public function admin(): static
    {
        return $this->state(fn () => ['role' => 'admin', 'phone' => null]);
    }
}
```

- [x] **Step 6: Run the tests**

```bash
php artisan migrate:fresh
php artisan test --filter=UserModelTest
```

Expected: 3 passing.

- [x] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: users table with role, phone and full name accessor"
```

---

## Task 3: Patient profile and favourites

**Files:**
- Create: `database/migrations/*_create_patient_profiles_table.php`
- Create: `database/migrations/*_create_patient_favorites_table.php`
- Create: `app/Models/PatientProfile.php`, `database/factories/PatientProfileFactory.php`
- Test: `tests/Feature/PatientProfileTest.php`

**Interfaces:**
- Consumes: `User` from Task 2.
- Produces: `PatientProfile` with `user()` (BelongsTo), `favorites()` (BelongsToMany of `PsychologistProfile`), and columns `gender`, `date_of_birth`, `city`, `notes`, `appointment_count`. `PatientProfileFactory` usable as `PatientProfile::factory()->create()` — it creates its own user.

> The `favorites()` relation targets a table created in Task 4. Run Task 4's migration before the favourites test, or run the two tasks back to back; the plan orders them this way because the pivot conceptually belongs to the patient.

- [x] **Step 1: Write the failing test**

`tests/Feature/PatientProfileTest.php`:

```php
<?php

use App\Models\PatientProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('belongs to a user with the patient role', function () {
    $profile = PatientProfile::factory()->create();

    expect($profile->user->role)->toBe('patient');
});

it('defaults the appointment count to zero', function () {
    expect(PatientProfile::factory()->create()->appointment_count)->toBe(0);
});
```

- [x] **Step 2: Run it to verify it fails**

```bash
php artisan test --filter=PatientProfileTest
```

Expected: FAIL — class `App\Models\PatientProfile` not found.

- [x] **Step 3: Write the migrations**

```bash
php artisan make:migration create_patient_profiles_table
php artisan make:migration create_patient_favorites_table
```

`create_patient_profiles_table`:

```php
Schema::create('patient_profiles', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
    $table->enum('gender', ['male', 'female', 'other'])->nullable();
    $table->date('date_of_birth')->nullable();
    $table->string('city', 100)->nullable();
    $table->text('notes')->nullable();
    $table->unsignedInteger('appointment_count')->default(0);
    $table->timestamps();
});
```

`create_patient_favorites_table`:

```php
Schema::create('patient_favorites', function (Blueprint $table) {
    $table->id();
    $table->foreignId('patient_profile_id')->constrained()->cascadeOnDelete();
    $table->foreignId('psychologist_profile_id')->constrained()->cascadeOnDelete();
    $table->timestamps();

    $table->unique(['patient_profile_id', 'psychologist_profile_id'], 'patient_favorite_unique');
});
```

The explicit index name matters: the generated one exceeds MySQL's 64-character identifier limit.

- [x] **Step 4: Write the model and factory**

`app/Models/PatientProfile.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Model;

class PatientProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'gender', 'date_of_birth', 'city', 'notes', 'appointment_count',
    ];

    protected function casts(): array
    {
        return ['date_of_birth' => 'date', 'appointment_count' => 'integer'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function favorites(): BelongsToMany
    {
        return $this->belongsToMany(
            PsychologistProfile::class,
            'patient_favorites',
            'patient_profile_id',
            'psychologist_profile_id',
        );
    }
}
```

`database/factories/PatientProfileFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PatientProfileFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->patient(),
            'gender' => $this->faker->randomElement(['male', 'female', 'other']),
            'date_of_birth' => $this->faker->dateTimeBetween('-60 years', '-18 years'),
            'city' => $this->faker->randomElement(['Casablanca', 'Rabat', 'Marrakech', 'Tanger']),
            'notes' => null,
            'appointment_count' => 0,
        ];
    }
}
```

- [x] **Step 5: Run the tests**

```bash
php artisan migrate:fresh && php artisan test --filter=PatientProfileTest
```

Expected: 2 passing. If the favourites migration fails on a missing `psychologist_profiles` table, complete Task 4 and rerun.

- [x] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: patient profile and favourites pivot"
```

---

## Task 4: Psychologist profile, taxonomies and sub-resources

**Files:**
- Create: `database/migrations/*_create_psychologist_profiles_table.php`
- Create: `database/migrations/*_create_psychologist_taxonomies_tables.php`
- Create: `database/migrations/*_create_psychologist_subresources_tables.php`
- Create: `app/Models/PsychologistProfile.php`, `Education.php`, `Experience.php`, `AvailabilityRule.php`, `TimeRange.php`
- Create: `database/factories/PsychologistProfileFactory.php`
- Test: `tests/Feature/PsychologistProfileTest.php`

**Interfaces:**
- Consumes: `User` from Task 2.
- Produces: `PsychologistProfile` with `user()`, `specialties()`, `languages()`, `approaches()`, `modes()` (each a HasMany over a `code` column), `educations()`, `experiences()`, `availabilityRules()`. `AvailabilityRule` has `ranges()` (HasMany of `TimeRange`). `PsychologistProfileFactory` creates its own psychologist user and a unique slug.

- [x] **Step 1: Write the failing test**

`tests/Feature/PsychologistProfileTest.php`:

```php
<?php

use App\Models\PsychologistProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('stores the hourly price as integer centimes', function () {
    $profile = PsychologistProfile::factory()->create(['price_per_hour' => 40000]);

    expect($profile->price_per_hour)->toBe(40000)->toBeInt();
});

it('stores hyphenated specialty codes verbatim', function () {
    $profile = PsychologistProfile::factory()->create();
    $profile->specialties()->create(['code' => 'self-esteem']);

    expect($profile->specialties()->pluck('code')->all())->toContain('self-esteem');
});

it('holds several time ranges per weekday', function () {
    $profile = PsychologistProfile::factory()->create();
    $rule = $profile->availabilityRules()->create(['weekday' => 1, 'enabled' => true]);
    $rule->ranges()->createMany([
        ['start_time' => '09:00', 'end_time' => '12:00'],
        ['start_time' => '14:00', 'end_time' => '18:00'],
    ]);

    expect($rule->fresh()->ranges)->toHaveCount(2);
});
```

- [x] **Step 2: Run it to verify it fails**

```bash
php artisan test --filter=PsychologistProfileTest
```

Expected: FAIL — class `App\Models\PsychologistProfile` not found.

- [x] **Step 3: Write the profile migration**

```php
Schema::create('psychologist_profiles', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
    $table->string('slug')->unique();
    $table->enum('gender', ['male', 'female', 'other']);
    $table->string('title');
    $table->string('headline');
    $table->text('bio');
    $table->string('intro_video_url')->nullable();
    $table->unsignedTinyInteger('years_of_experience')->default(0);
    $table->string('city', 100);
    $table->unsignedInteger('price_per_hour');           // centimes
    $table->char('currency', 3)->default('MAD');
    $table->decimal('rating', 2, 1)->default(0);
    $table->unsignedInteger('review_count')->default(0);
    $table->unsignedInteger('patient_count')->default(0);
    $table->enum('verification_status', ['draft', 'pending', 'approved', 'rejected', 'suspended'])
        ->default('draft');
    $table->boolean('accepts_new_patients')->default(true);
    $table->unsignedInteger('response_time_minutes')->default(60);
    $table->dateTime('next_available_at')->nullable();
    $table->unsignedTinyInteger('profile_completion')->default(0);
    $table->timestamp('submitted_at')->nullable();
    $table->timestamp('approved_at')->nullable();
    $table->timestamps();

    $table->index(['verification_status', 'accepts_new_patients']);
    $table->index('price_per_hour');
    $table->index('rating');
    $table->index('next_available_at');
});
```

- [x] **Step 4: Write the taxonomy migration**

One file creating four structurally identical tables:

```php
foreach ([
    'psychologist_specialty',
    'psychologist_language',
    'psychologist_approach',
    'psychologist_mode',
] as $table) {
    Schema::create($table, function (Blueprint $t) use ($table) {
        $t->id();
        $t->foreignId('psychologist_profile_id')->constrained()->cascadeOnDelete();
        $t->string('code', 30);

        $t->unique(['psychologist_profile_id', 'code'], substr($table, 0, 40).'_unique');
        $t->index('code');
    });
}
```

`down()` drops them in reverse order.

The `code` column holds the TypeScript value verbatim — `anxiety`, `self-esteem`, `ary`, `cbt`, `video`. No reference table: these sets are closed and defined in the frontend.

- [x] **Step 5: Write the sub-resources migration**

```php
Schema::create('educations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('psychologist_profile_id')->constrained()->cascadeOnDelete();
    $table->string('degree');
    $table->string('institution');
    $table->unsignedSmallInteger('year');
    $table->timestamps();
});

Schema::create('experiences', function (Blueprint $table) {
    $table->id();
    $table->foreignId('psychologist_profile_id')->constrained()->cascadeOnDelete();
    $table->string('role');
    $table->string('organization');
    $table->unsignedSmallInteger('start_year');
    $table->unsignedSmallInteger('end_year')->nullable();
    $table->text('description')->nullable();
    $table->timestamps();
});

Schema::create('availability_rules', function (Blueprint $table) {
    $table->id();
    $table->foreignId('psychologist_profile_id')->constrained()->cascadeOnDelete();
    $table->unsignedTinyInteger('weekday');   // 0 = Sunday
    $table->boolean('enabled')->default(true);
    $table->timestamps();

    $table->unique(['psychologist_profile_id', 'weekday'], 'availability_rule_unique');
});

Schema::create('time_ranges', function (Blueprint $table) {
    $table->id();
    $table->foreignId('availability_rule_id')->constrained()->cascadeOnDelete();
    $table->time('start_time');
    $table->time('end_time');
    $table->timestamps();
});
```

- [x] **Step 6: Write the models**

`app/Models/PsychologistProfile.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PsychologistProfile extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'price_per_hour' => 'integer',
            'review_count' => 'integer',
            'patient_count' => 'integer',
            'rating' => 'float',
            'accepts_new_patients' => 'boolean',
            'response_time_minutes' => 'integer',
            'profile_completion' => 'integer',
            'years_of_experience' => 'integer',
            'next_available_at' => 'datetime',
            'submitted_at' => 'datetime',
            'approved_at' => 'datetime',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function specialties(): HasMany
    {
        return $this->hasMany(PsychologistSpecialty::class);
    }

    public function languages(): HasMany
    {
        return $this->hasMany(PsychologistLanguage::class);
    }

    public function approaches(): HasMany
    {
        return $this->hasMany(PsychologistApproach::class);
    }

    public function modes(): HasMany
    {
        return $this->hasMany(PsychologistMode::class);
    }

    public function educations(): HasMany
    {
        return $this->hasMany(Education::class);
    }

    public function experiences(): HasMany
    {
        return $this->hasMany(Experience::class);
    }

    public function availabilityRules(): HasMany
    {
        return $this->hasMany(AvailabilityRule::class);
    }
}
```

Four one-line taxonomy models, e.g. `app/Models/PsychologistSpecialty.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PsychologistSpecialty extends Model
{
    protected $table = 'psychologist_specialty';
    protected $fillable = ['psychologist_profile_id', 'code'];
}
```

Repeat verbatim for `PsychologistLanguage` (`psychologist_language`), `PsychologistApproach` (`psychologist_approach`), `PsychologistMode` (`psychologist_mode`).

`app/Models/Education.php`, `Experience.php`, `TimeRange.php` follow the same shape with `$fillable` matching their columns. `app/Models/AvailabilityRule.php` additionally has:

```php
public function ranges(): HasMany
{
    return $this->hasMany(TimeRange::class);
}
```

- [x] **Step 7: Write the factory**

`database/factories/PsychologistProfileFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PsychologistProfileFactory extends Factory
{
    public function definition(): array
    {
        $name = $this->faker->name();

        return [
            'user_id' => User::factory()->psychologist(),
            'slug' => Str::slug($name).'-'.$this->faker->unique()->numberBetween(1, 99999),
            'gender' => $this->faker->randomElement(['male', 'female']),
            'title' => 'Psychologue clinicien',
            'headline' => $this->faker->sentence(6),
            'bio' => $this->faker->paragraph(),
            'years_of_experience' => $this->faker->numberBetween(1, 25),
            'city' => $this->faker->randomElement(['Casablanca', 'Rabat', 'Marrakech', 'Tanger']),
            'price_per_hour' => $this->faker->numberBetween(20000, 80000),  // centimes
            'currency' => 'MAD',
            'rating' => $this->faker->randomFloat(1, 3.5, 5),
            'review_count' => $this->faker->numberBetween(0, 120),
            'patient_count' => $this->faker->numberBetween(0, 200),
            'verification_status' => 'approved',
            'accepts_new_patients' => true,
            'response_time_minutes' => $this->faker->numberBetween(15, 240),
            'next_available_at' => now()->addDays($this->faker->numberBetween(0, 10)),
            'profile_completion' => 100,
            'approved_at' => now()->subMonths(2),
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => ['verification_status' => 'pending', 'approved_at' => null]);
    }
}
```

- [x] **Step 8: Run the tests**

```bash
php artisan migrate:fresh && php artisan test --filter=PsychologistProfileTest
```

Expected: 3 passing. Rerun `--filter=PatientProfileTest` too — the favourites pivot can now migrate.

- [x] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: psychologist profile, taxonomies, availability and sub-resources"
```

---

## Task 5: API Resources and the contract guard

**Files:**
- Create: `app/Http/Resources/UserResource.php`, `PatientResource.php`, `PsychologistResource.php`
- Test: `tests/Unit/ResourceContractTest.php`

**Interfaces:**
- Consumes: models from Tasks 2-4.
- Produces: `PatientResource` and `PsychologistResource`, each accepting a profile model with its relations eager-loaded. Both emit camelCase keys and a string `id`. Consumed by Tasks 6, 7 and 8.

This is the task the whole milestone rests on. The test comes first and is exhaustive on purpose.

- [x] **Step 1: Write the failing contract test**

`tests/Unit/ResourceContractTest.php`:

```php
<?php

use App\Http\Resources\PatientResource;
use App\Http\Resources\PsychologistResource;
use App\Models\PatientProfile;
use App\Models\PsychologistProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * These key lists are transcribed from the frontend's domain types at
 * C:\laragon\www\allomonpsy\src\types\index.ts (interfaces BaseUser,
 * Patient and Psychologist). They are duplicated here on purpose: the
 * backend cannot import TypeScript, so the contract is pinned by an
 * explicit list that fails loudly the day either side drifts.
 */
$patientKeys = [
    'id', 'role', 'firstName', 'lastName', 'fullName', 'email', 'phone',
    'avatarUrl', 'locale', 'createdAt',
    'gender', 'dateOfBirth', 'city', 'favoritePsychologistIds',
    'appointmentCount', 'notes',
];

$psychologistKeys = [
    'id', 'role', 'firstName', 'lastName', 'fullName', 'email', 'phone',
    'avatarUrl', 'locale', 'createdAt',
    'slug', 'gender', 'title', 'headline', 'bio', 'introVideoUrl',
    'specialties', 'approaches', 'languages', 'yearsOfExperience',
    'education', 'experience', 'city', 'pricePerHour', 'currency',
    'rating', 'reviewCount', 'patientCount', 'verificationStatus',
    'isVerified', 'acceptsNewPatients', 'modes', 'nextAvailableAt',
    'responseTimeMinutes', 'availability', 'submittedAt', 'approvedAt',
    'profileCompletion',
];

it('emits exactly the Patient keys', function () use ($patientKeys) {
    $profile = PatientProfile::factory()->create();
    $payload = PatientResource::make($profile->load('user', 'favorites'))->resolve();

    expect(array_keys($payload))->toEqualCanonicalizing($patientKeys);
});

it('emits exactly the Psychologist keys', function () use ($psychologistKeys) {
    $profile = PsychologistProfile::factory()->create();
    $payload = PsychologistResource::make($profile->fresh()->load([
        'user', 'specialties', 'languages', 'approaches', 'modes',
        'educations', 'experiences', 'availabilityRules.ranges',
    ]))->resolve();

    expect(array_keys($payload))->toEqualCanonicalizing($psychologistKeys);
});

it('returns the id as a string', function () {
    $profile = PatientProfile::factory()->create();
    $payload = PatientResource::make($profile->load('user', 'favorites'))->resolve();

    expect($payload['id'])->toBeString();
});

it('derives isVerified from the verification status', function () {
    $approved = PsychologistProfile::factory()->create(['verification_status' => 'approved']);
    $pending = PsychologistProfile::factory()->pending()->create();

    $load = fn ($p) => $p->fresh()->load([
        'user', 'specialties', 'languages', 'approaches', 'modes',
        'educations', 'experiences', 'availabilityRules.ranges',
    ]);

    expect(PsychologistResource::make($load($approved))->resolve()['isVerified'])->toBeTrue()
        ->and(PsychologistResource::make($load($pending))->resolve()['isVerified'])->toBeFalse();
});

it('emits money as an integer number of centimes', function () {
    $profile = PsychologistProfile::factory()->create(['price_per_hour' => 40000]);
    $payload = PsychologistResource::make($profile->fresh()->load([
        'user', 'specialties', 'languages', 'approaches', 'modes',
        'educations', 'experiences', 'availabilityRules.ranges',
    ]))->resolve();

    expect($payload['pricePerHour'])->toBe(40000);
});

it('emits availability as rules holding a list of ranges', function () {
    $profile = PsychologistProfile::factory()->create();
    $rule = $profile->availabilityRules()->create(['weekday' => 2, 'enabled' => true]);
    $rule->ranges()->create(['start_time' => '09:00', 'end_time' => '12:00']);

    $payload = PsychologistResource::make($profile->fresh()->load([
        'user', 'specialties', 'languages', 'approaches', 'modes',
        'educations', 'experiences', 'availabilityRules.ranges',
    ]))->resolve();

    expect($payload['availability'][0])
        ->toHaveKeys(['id', 'weekday', 'enabled', 'ranges'])
        ->and($payload['availability'][0]['ranges'][0])
        ->toHaveKeys(['id', 'startTime', 'endTime'])
        ->and($payload['availability'][0]['ranges'][0]['startTime'])->toBe('09:00');
});
```

- [x] **Step 2: Run it to verify it fails**

```bash
php artisan test --filter=ResourceContract
```

Expected: FAIL — `App\Http\Resources\PatientResource` not found.

- [x] **Step 3: Write UserResource**

`app/Http/Resources/UserResource.php` — the shared `BaseUser` block, returned as a plain array so the profile resources can spread it:

```php
<?php

namespace App\Http\Resources;

use App\Models\User;

class UserResource
{
    /** The BaseUser fields, shared by both profile resources. */
    public static function fields(User $user): array
    {
        return [
            'id' => (string) $user->id,
            'role' => $user->role,
            'firstName' => $user->first_name,
            'lastName' => $user->last_name,
            'fullName' => $user->full_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatarUrl' => $user->avatar_url ?? '',
            'locale' => $user->locale,
            'createdAt' => $user->created_at->toIso8601String(),
        ];
    }
}
```

`avatarUrl` falls back to `''` because the type declares it non-optional.

- [x] **Step 4: Write PatientResource**

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PatientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            ...UserResource::fields($this->user),
            'id' => (string) $this->id,
            'gender' => $this->gender,
            'dateOfBirth' => $this->date_of_birth?->toDateString(),
            'city' => $this->city,
            'favoritePsychologistIds' => $this->favorites
                ->map(fn ($p) => (string) $p->id)->values()->all(),
            'appointmentCount' => $this->appointment_count,
            'notes' => $this->notes,
        ];
    }
}
```

The `id` override is deliberate and must stay after the spread: the frontend identifies a patient by their profile id, which is what `patientId` refers to throughout the appointment and payment types.

- [x] **Step 5: Write PsychologistResource**

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PsychologistResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            ...UserResource::fields($this->user),
            'id' => (string) $this->id,
            'slug' => $this->slug,
            'gender' => $this->gender,
            'title' => $this->title,
            'headline' => $this->headline,
            'bio' => $this->bio,
            'introVideoUrl' => $this->intro_video_url,
            'specialties' => $this->specialties->pluck('code')->values()->all(),
            'approaches' => $this->approaches->pluck('code')->values()->all(),
            'languages' => $this->languages->pluck('code')->values()->all(),
            'modes' => $this->modes->pluck('code')->values()->all(),
            'yearsOfExperience' => $this->years_of_experience,
            'education' => $this->educations->map(fn ($e) => [
                'id' => (string) $e->id,
                'degree' => $e->degree,
                'institution' => $e->institution,
                'year' => (int) $e->year,
            ])->values()->all(),
            'experience' => $this->experiences->map(fn ($e) => [
                'id' => (string) $e->id,
                'role' => $e->role,
                'organization' => $e->organization,
                'startYear' => (int) $e->start_year,
                'endYear' => $e->end_year ? (int) $e->end_year : null,
                'description' => $e->description,
            ])->values()->all(),
            'city' => $this->city,
            'pricePerHour' => $this->price_per_hour,
            'currency' => $this->currency,
            'rating' => (float) $this->rating,
            'reviewCount' => $this->review_count,
            'patientCount' => $this->patient_count,
            'verificationStatus' => $this->verification_status,
            'isVerified' => $this->verification_status === 'approved',
            'acceptsNewPatients' => $this->accepts_new_patients,
            'nextAvailableAt' => $this->next_available_at?->toIso8601String(),
            'responseTimeMinutes' => $this->response_time_minutes,
            'availability' => $this->availabilityRules->map(fn ($rule) => [
                'id' => (string) $rule->id,
                'weekday' => (int) $rule->weekday,
                'enabled' => (bool) $rule->enabled,
                'ranges' => $rule->ranges->map(fn ($r) => [
                    'id' => (string) $r->id,
                    'startTime' => substr($r->start_time, 0, 5),
                    'endTime' => substr($r->end_time, 0, 5),
                ])->values()->all(),
            ])->values()->all(),
            'submittedAt' => $this->submitted_at?->toIso8601String(),
            'approvedAt' => $this->approved_at?->toIso8601String(),
            'profileCompletion' => $this->profile_completion,
        ];
    }
}
```

`substr(..., 0, 5)` turns MySQL's `09:00:00` into the `"09:00"` the `TimeRange` type declares.

- [x] **Step 6: Run the tests**

```bash
php artisan test --filter=ResourceContract
```

Expected: 6 passing. A failure here names the exact key that drifted — that is the point of the test.

- [x] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: patient and psychologist API resources with contract test"
```

---

## Task 6: Authentication endpoints

**Files:**
- Create: `app/Http/Requests/RegisterRequest.php`, `LoginRequest.php`
- Create: `app/Http/Controllers/Api/AuthController.php`
- Modify: `routes/api.php`
- Test: `tests/Feature/AuthTest.php`

**Interfaces:**
- Consumes: `User`, `PatientProfile`, `PatientResource`, `PsychologistResource`.
- Produces: `POST /api/register`, `POST /api/login`, `POST /api/logout`, `GET /api/me`. Register and login both return `{ token: string, user: <resource> }`.

- [x] **Step 1: Write the failing test**

`tests/Feature/AuthTest.php`:

```php
<?php

use App\Models\PatientProfile;
use App\Models\PsychologistProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

$valid = [
    'first_name' => 'Yasmine',
    'last_name' => 'Ouhadi',
    'email' => 'yasmine@example.com',
    'phone' => '+212 6 12 34 56 78',
    'password' => 'password123',
    'password_confirmation' => 'password123',
];

it('registers a patient and returns a token', function () use ($valid) {
    $response = $this->postJson('/api/register', $valid)->assertCreated();

    expect($response->json('token'))->toBeString()->not->toBeEmpty()
        ->and($response->json('user.role'))->toBe('patient')
        ->and($response->json('user.fullName'))->toBe('Yasmine Ouhadi');

    $this->assertDatabaseHas('users', ['email' => 'yasmine@example.com', 'role' => 'patient']);
    $this->assertDatabaseCount('patient_profiles', 1);
});

it('rejects a duplicate email with 422', function () use ($valid) {
    $this->postJson('/api/register', $valid)->assertCreated();

    $this->postJson('/api/register', $valid)
        ->assertStatus(422)
        ->assertJsonValidationErrors('email');
});

it('requires a phone number', function () use ($valid) {
    $this->postJson('/api/register', [...$valid, 'phone' => ''])
        ->assertStatus(422)
        ->assertJsonValidationErrors('phone');
});

it('logs in with valid credentials', function () use ($valid) {
    $this->postJson('/api/register', $valid);

    $this->postJson('/api/login', [
        'email' => 'yasmine@example.com',
        'password' => 'password123',
    ])->assertOk()->assertJsonStructure(['token', 'user' => ['id', 'role', 'fullName']]);
});

it('refuses a wrong password with 422', function () use ($valid) {
    $this->postJson('/api/register', $valid);

    $this->postJson('/api/login', [
        'email' => 'yasmine@example.com',
        'password' => 'wrong-password',
    ])->assertStatus(422)->assertJsonValidationErrors('email');
});

it('rejects an unauthenticated call to me with 401', function () {
    $this->getJson('/api/me')->assertStatus(401);
});

it('returns the patient resource from me', function () {
    $profile = PatientProfile::factory()->create();

    $this->actingAs($profile->user, 'sanctum')
        ->getJson('/api/me')
        ->assertOk()
        ->assertJsonPath('role', 'patient')
        ->assertJsonPath('id', (string) $profile->id);
});

it('returns the psychologist resource from me', function () {
    $profile = PsychologistProfile::factory()->create();

    $this->actingAs($profile->user, 'sanctum')
        ->getJson('/api/me')
        ->assertOk()
        ->assertJsonPath('role', 'psychologist')
        ->assertJsonPath('slug', $profile->slug);
});

it('revokes the current token on logout', function () use ($valid) {
    $token = $this->postJson('/api/register', $valid)->json('token');

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/logout')->assertNoContent();

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/me')->assertStatus(401);
});
```

- [x] **Step 2: Run it to verify it fails**

```bash
php artisan test --filter=AuthTest
```

Expected: FAIL — 404 on every route.

- [x] **Step 3: Write the form requests**

`app/Http/Requests/RegisterRequest.php`:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'min:2', 'max:100'],
            'last_name' => ['required', 'string', 'min:2', 'max:100'],
            'email' => ['required', 'email', 'max:191', 'unique:users,email'],
            // Mirrors the frontend rule: at least 9 digits once separators
            // are stripped (src/app/(auth)/register/page.tsx:57).
            'phone' => ['required', 'string', 'max:30', 'regex:/^\D*(\d\D*){9,}$/'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.required' => 'Numéro de téléphone requis',
            'phone.regex' => 'Numéro de téléphone invalide',
        ];
    }
}
```

`app/Http/Requests/LoginRequest.php`:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ];
    }
}
```

- [x] **Step 4: Write the controller**

`app/Http/Controllers/Api/AuthController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\PatientResource;
use App\Http\Resources\PsychologistResource;
use App\Models\PatientProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([...$request->validated(), 'role' => 'patient']);
        PatientProfile::create(['user_id' => $user->id]);

        return response()->json([
            'token' => $user->createToken('api')->plainTextToken,
            'user' => $this->resourceFor($user),
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->validated('email'))->first();

        if (! $user || ! Hash::check($request->validated('password'), $user->password)) {
            // Reported on `email` so the frontend can surface it under the
            // email field; the message never says which half was wrong.
            throw ValidationException::withMessages([
                'email' => 'Identifiants incorrects',
            ]);
        }

        return response()->json([
            'token' => $user->createToken('api')->plainTextToken,
            'user' => $this->resourceFor($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(null, 204);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($this->resourceFor($request->user()));
    }

    /** Resolves the payload matching the user's role. */
    private function resourceFor(User $user): array
    {
        if ($user->role === 'psychologist') {
            $profile = $user->psychologistProfile()->with([
                'user', 'specialties', 'languages', 'approaches', 'modes',
                'educations', 'experiences', 'availabilityRules.ranges',
            ])->firstOrFail();

            return PsychologistResource::make($profile)->resolve();
        }

        $profile = $user->patientProfile()->with(['user', 'favorites'])->firstOrFail();

        return PatientResource::make($profile)->resolve();
    }
}
```

- [x] **Step 5: Register the routes**

`routes/api.php`:

```php
use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => ['status' => 'ok']);

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
});
```

- [x] **Step 6: Run the tests**

```bash
php artisan test --filter=AuthTest
```

Expected: 9 passing.

- [x] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: register, login, logout and me endpoints"
```

---

## Task 7: Marketplace listing with filters, sorts and pagination

**Files:**
- Create: `app/Http/Requests/PsychologistIndexRequest.php`
- Create: `app/Queries/PsychologistQuery.php`
- Create: `app/Http/Controllers/Api/PsychologistController.php`
- Modify: `routes/api.php`
- Test: `tests/Feature/PsychologistIndexTest.php`

**Interfaces:**
- Consumes: `PsychologistProfile`, `PsychologistResource`.
- Produces: `GET /api/psychologists` returning `{ data, meta: { total, page, perPage, lastPage } }`. `PsychologistQuery::apply(array $filters): Builder` is reusable by later slices.

- [x] **Step 1: Write the failing test**

`tests/Feature/PsychologistIndexTest.php`:

```php
<?php

use App\Models\PsychologistProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns the camelCase pagination envelope', function () {
    PsychologistProfile::factory()->count(12)->create();

    $this->getJson('/api/psychologists')
        ->assertOk()
        ->assertJsonStructure(['data', 'meta' => ['total', 'page', 'perPage', 'lastPage']])
        ->assertJsonPath('meta.total', 12)
        ->assertJsonPath('meta.page', 1)
        ->assertJsonPath('meta.perPage', 9)      // the frontend default
        ->assertJsonPath('meta.lastPage', 2)
        ->assertJsonCount(9, 'data');
});

it('lists only approved practitioners', function () {
    PsychologistProfile::factory()->count(3)->create();
    PsychologistProfile::factory()->pending()->count(2)->create();

    $this->getJson('/api/psychologists')->assertJsonPath('meta.total', 3);
});

it('filters by specialty code including hyphenated ones', function () {
    $match = PsychologistProfile::factory()->create();
    $match->specialties()->create(['code' => 'self-esteem']);
    PsychologistProfile::factory()->create()->specialties()->create(['code' => 'anxiety']);

    $this->getJson('/api/psychologists?specialties[]=self-esteem')
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.slug', $match->slug);
});

it('filters by any of several languages', function () {
    PsychologistProfile::factory()->create()->languages()->create(['code' => 'ary']);
    PsychologistProfile::factory()->create()->languages()->create(['code' => 'en']);
    PsychologistProfile::factory()->create()->languages()->create(['code' => 'es']);

    $this->getJson('/api/psychologists?languages[]=ary&languages[]=en')
        ->assertJsonPath('meta.total', 2);
});

it('filters on a price range in centimes', function () {
    PsychologistProfile::factory()->create(['price_per_hour' => 15000]);
    PsychologistProfile::factory()->create(['price_per_hour' => 40000]);
    PsychologistProfile::factory()->create(['price_per_hour' => 90000]);

    $this->getJson('/api/psychologists?min_price=20000&max_price=50000')
        ->assertJsonPath('meta.total', 1);
});

it('searches across name, title, headline, city and bio', function () {
    $target = PsychologistProfile::factory()->create(['city' => 'Essaouira']);

    $this->getJson('/api/psychologists?q=essaouira')
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.slug', $target->slug);
});

it('sorts by price ascending', function () {
    PsychologistProfile::factory()->create(['price_per_hour' => 90000]);
    PsychologistProfile::factory()->create(['price_per_hour' => 15000]);

    $this->getJson('/api/psychologists?sort=price_asc')
        ->assertJsonPath('data.0.pricePerHour', 15000);
});

it('ranks by relevance when no sort is given', function () {
    // rating x log10(reviewCount + 10): 4.0 x log10(110) = 8.16
    //                                   5.0 x log10(11)  = 5.20
    PsychologistProfile::factory()->create([
        'slug' => 'volume', 'rating' => 4.0, 'review_count' => 100,
        'accepts_new_patients' => true,
    ]);
    PsychologistProfile::factory()->create([
        'slug' => 'newcomer', 'rating' => 5.0, 'review_count' => 1,
        'accepts_new_patients' => true,
    ]);

    $this->getJson('/api/psychologists')->assertJsonPath('data.0.slug', 'volume');
});

it('puts practitioners refusing new patients last', function () {
    PsychologistProfile::factory()->create([
        'slug' => 'closed', 'rating' => 5.0, 'review_count' => 500,
        'accepts_new_patients' => false,
    ]);
    PsychologistProfile::factory()->create([
        'slug' => 'open', 'rating' => 3.5, 'review_count' => 1,
        'accepts_new_patients' => true,
    ]);

    $this->getJson('/api/psychologists')->assertJsonPath('data.0.slug', 'open');
});

it('filters on availability within a number of days', function () {
    PsychologistProfile::factory()->create(['next_available_at' => now()->addDay()]);
    PsychologistProfile::factory()->create(['next_available_at' => now()->addDays(20)]);
    PsychologistProfile::factory()->create(['next_available_at' => null]);

    $this->getJson('/api/psychologists?available_within_days=7')
        ->assertJsonPath('meta.total', 1);
});

it('rejects an unknown sort with 422', function () {
    $this->getJson('/api/psychologists?sort=cheapest')
        ->assertStatus(422)
        ->assertJsonValidationErrors('sort');
});
```

- [x] **Step 2: Run it to verify it fails**

```bash
php artisan test --filter=PsychologistIndexTest
```

Expected: FAIL — 404.

- [x] **Step 3: Write the request validation**

`app/Http/Requests/PsychologistIndexRequest.php`:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PsychologistIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:191'],
            'specialties' => ['nullable', 'array'],
            'specialties.*' => ['string', 'max:30'],
            'languages' => ['nullable', 'array'],
            'languages.*' => ['string', 'max:30'],
            'approaches' => ['nullable', 'array'],
            'approaches.*' => ['string', 'max:30'],
            'gender' => ['nullable', 'in:male,female,other,any'],
            'min_price' => ['nullable', 'integer', 'min:0'],
            'max_price' => ['nullable', 'integer', 'min:0'],
            'min_experience' => ['nullable', 'integer', 'min:0'],
            'max_experience' => ['nullable', 'integer', 'min:0'],
            'available_within_days' => ['nullable', 'integer', 'min:0', 'max:365'],
            'min_rating' => ['nullable', 'numeric', 'between:0,5'],
            'sort' => ['nullable', 'in:relevance,price_asc,price_desc,rating_desc,experience_desc,availability'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:60'],
        ];
    }
}
```

- [x] **Step 4: Write the query object**

`app/Queries/PsychologistQuery.php`:

```php
<?php

namespace App\Queries;

use App\Models\PsychologistProfile;
use Illuminate\Database\Eloquent\Builder;

/**
 * Mirrors the mock marketplace in src/lib/services/psychologist-service.ts
 * (matches() at :34, sortList() at :60).
 */
class PsychologistQuery
{
    public static function apply(array $f): Builder
    {
        // The frontend never sends verified_only, and the mock defaults it
        // to true, so listing is always restricted to approved profiles.
        $query = PsychologistProfile::query()->where('verification_status', 'approved');

        if (! empty($f['q'])) {
            $term = '%'.$f['q'].'%';
            $query->where(function (Builder $q) use ($term) {
                $q->where('title', 'like', $term)
                    ->orWhere('headline', 'like', $term)
                    ->orWhere('city', 'like', $term)
                    ->orWhere('bio', 'like', $term)
                    ->orWhereHas('user', fn (Builder $u) => $u
                        ->whereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", [$term]));
            });
        }

        foreach ([
            'specialties' => 'specialties',
            'languages' => 'languages',
            'approaches' => 'approaches',
        ] as $key => $relation) {
            if (! empty($f[$key])) {
                $query->whereHas($relation, fn (Builder $q) => $q->whereIn('code', $f[$key]));
            }
        }

        if (! empty($f['gender']) && $f['gender'] !== 'any') {
            $query->where('gender', $f['gender']);
        }

        foreach ([
            ['min_price', 'price_per_hour', '>='],
            ['max_price', 'price_per_hour', '<='],
            ['min_experience', 'years_of_experience', '>='],
            ['max_experience', 'years_of_experience', '<='],
            ['min_rating', 'rating', '>='],
        ] as [$key, $column, $operator]) {
            if (isset($f[$key])) {
                $query->where($column, $operator, $f[$key]);
            }
        }

        if (isset($f['available_within_days'])) {
            // The mock compares against the start of today plus days + 1.
            $limit = now()->startOfDay()->addDays((int) $f['available_within_days'] + 1);
            $query->whereNotNull('next_available_at')->where('next_available_at', '<', $limit);
        }

        return self::sort($query, $f['sort'] ?? 'relevance');
    }

    private static function sort(Builder $query, string $sort): Builder
    {
        return match ($sort) {
            'price_asc' => $query->orderBy('price_per_hour'),
            'price_desc' => $query->orderByDesc('price_per_hour'),
            'rating_desc' => $query->orderByDesc('rating')->orderByDesc('review_count'),
            'experience_desc' => $query->orderByDesc('years_of_experience'),
            'availability' => $query->orderByRaw('next_available_at IS NULL, next_available_at ASC'),
            // Relevance: accepting patients first, then rating weighted by volume.
            default => $query->orderByRaw(
                'accepts_new_patients DESC, rating * LOG10(review_count + 10) DESC'
            ),
        };
    }
}
```

- [x] **Step 5: Write the controller**

`app/Http/Controllers/Api/PsychologistController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PsychologistIndexRequest;
use App\Http\Resources\PsychologistResource;
use App\Queries\PsychologistQuery;
use Illuminate\Http\JsonResponse;

class PsychologistController extends Controller
{
    private const RELATIONS = [
        'user', 'specialties', 'languages', 'approaches', 'modes',
        'educations', 'experiences', 'availabilityRules.ranges',
    ];

    public function index(PsychologistIndexRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $perPage = (int) ($filters['per_page'] ?? 9);

        $page = PsychologistQuery::apply($filters)
            ->with(self::RELATIONS)
            ->paginate($perPage, ['*'], 'page', $filters['page'] ?? 1);

        return response()->json([
            'data' => PsychologistResource::collection($page->items())->resolve(),
            'meta' => [
                'total' => $page->total(),
                'page' => $page->currentPage(),
                'perPage' => $page->perPage(),
                'lastPage' => $page->lastPage(),
            ],
        ]);
    }
}
```

The meta is hand-built on purpose — Laravel's default emits `current_page` / `per_page` / `last_page`, which `Paginated<T>` does not accept.

- [x] **Step 6: Add the route**

In `routes/api.php`, above the authenticated group:

```php
use App\Http\Controllers\Api\PsychologistController;

Route::get('/psychologists', [PsychologistController::class, 'index']);
```

- [x] **Step 7: Run the tests**

```bash
php artisan test --filter=PsychologistIndexTest
```

Expected: 11 passing.

- [x] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: marketplace listing with filters, sorts and camelCase pagination"
```

---

## Task 8: Public profile by slug

**Files:**
- Modify: `app/Http/Controllers/Api/PsychologistController.php`
- Modify: `routes/api.php`
- Test: `tests/Feature/PsychologistShowTest.php`

**Interfaces:**
- Consumes: Task 7's controller and relations.
- Produces: `GET /api/psychologists/{slug}` returning a bare `Psychologist` payload (no envelope — `getById` expects the object directly).

- [x] **Step 1: Write the failing test**

`tests/Feature/PsychologistShowTest.php`:

```php
<?php

use App\Models\PsychologistProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns a profile by slug, unwrapped', function () {
    $profile = PsychologistProfile::factory()->create(['slug' => 'yasmine-ouhadi']);

    $this->getJson('/api/psychologists/yasmine-ouhadi')
        ->assertOk()
        ->assertJsonPath('slug', 'yasmine-ouhadi')
        ->assertJsonPath('id', (string) $profile->id)
        ->assertJsonMissingPath('data');
});

it('404s on an unknown slug', function () {
    $this->getJson('/api/psychologists/nobody-here')->assertNotFound();
});

it('does not resolve a profile by its numeric id', function () {
    $profile = PsychologistProfile::factory()->create();

    $this->getJson("/api/psychologists/{$profile->id}")->assertNotFound();
});

it('includes the nested availability and education lists', function () {
    $profile = PsychologistProfile::factory()->create();
    $profile->educations()->create([
        'degree' => 'Master en psychologie clinique',
        'institution' => 'Université Hassan II',
        'year' => 2015,
    ]);
    $rule = $profile->availabilityRules()->create(['weekday' => 3, 'enabled' => true]);
    $rule->ranges()->create(['start_time' => '14:00', 'end_time' => '18:00']);

    $this->getJson("/api/psychologists/{$profile->slug}")
        ->assertJsonPath('education.0.year', 2015)
        ->assertJsonPath('availability.0.ranges.0.startTime', '14:00');
});
```

The third test is the one that pins decision 8: an id must not work.

- [x] **Step 2: Run it to verify it fails**

```bash
php artisan test --filter=PsychologistShowTest
```

Expected: FAIL — 404 on the valid slug too.

- [x] **Step 3: Add the show method**

In `PsychologistController`:

```php
use App\Models\PsychologistProfile;

public function show(PsychologistProfile $psychologist): JsonResponse
{
    abort_unless($psychologist->verification_status === 'approved', 404);

    return response()->json(
        PsychologistResource::make($psychologist->load(self::RELATIONS))->resolve()
    );
}
```

`PsychologistProfile::getRouteKeyName()` already returns `slug` (Task 4), so the binding resolves by slug and a numeric id 404s naturally.

- [x] **Step 4: Add the route**

```php
Route::get('/psychologists/{psychologist}', [PsychologistController::class, 'show']);
```

Declare it **after** `GET /psychologists`, so the collection route is not shadowed.

- [x] **Step 5: Run the tests**

```bash
php artisan test --filter=PsychologistShowTest
```

Expected: 4 passing.

- [x] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: public psychologist profile resolved by slug"
```

---

## Task 9: Seeders reproducing the mock volumes

**Files:**
- Create: `database/seeders/PsychologistSeeder.php`, `PatientSeeder.php`
- Modify: `database/seeders/DatabaseSeeder.php`
- Test: `tests/Feature/SeederTest.php`

**Interfaces:**
- Consumes: every factory from Tasks 2-4.
- Produces: `php artisan db:seed` yielding 20 practitioners and 10 patients with populated taxonomies and availability, plus a known demo login.

- [x] **Step 1: Write the failing test**

`tests/Feature/SeederTest.php`:

```php
<?php

use App\Models\PatientProfile;
use App\Models\PsychologistProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('seeds the mock volumes with usable profiles', function () {
    $this->seed();

    expect(PsychologistProfile::count())->toBe(20)
        ->and(PatientProfile::count())->toBe(10);

    $psy = PsychologistProfile::first();
    expect($psy->specialties)->not->toBeEmpty()
        ->and($psy->languages)->not->toBeEmpty()
        ->and($psy->availabilityRules)->not->toBeEmpty();
});

it('seeds a demo patient that can log in', function () {
    $this->seed();

    $this->postJson('/api/login', [
        'email' => 'patient@allomonpsy.test',
        'password' => 'password',
    ])->assertOk();
});
```

- [x] **Step 2: Run it to verify it fails**

```bash
php artisan test --filter=SeederTest
```

Expected: FAIL — counts are 0.

- [x] **Step 3: Write the psychologist seeder**

`database/seeders/PsychologistSeeder.php`:

```php
<?php

namespace Database\Seeders;

use App\Models\PsychologistProfile;
use Illuminate\Database\Seeder;

class PsychologistSeeder extends Seeder
{
    private const SPECIALTIES = [
        'anxiety', 'depression', 'stress', 'couple', 'family', 'child',
        'adolescent', 'trauma', 'addiction', 'eating', 'sleep', 'grief',
        'self-esteem', 'work',
    ];

    private const APPROACHES = [
        'cbt', 'psychoanalysis', 'systemic', 'emdr', 'humanist', 'mindfulness', 'act',
    ];

    private const LANGUAGES = ['fr', 'ar', 'ary', 'en', 'es', 'ber'];

    private const MODES = ['video', 'audio', 'chat'];

    public function run(): void
    {
        PsychologistProfile::factory()->count(20)->create()->each(function ($profile) {
            foreach (collect(self::SPECIALTIES)->random(3) as $code) {
                $profile->specialties()->create(['code' => $code]);
            }
            foreach (collect(self::APPROACHES)->random(2) as $code) {
                $profile->approaches()->create(['code' => $code]);
            }
            foreach (collect(self::LANGUAGES)->random(2) as $code) {
                $profile->languages()->create(['code' => $code]);
            }
            foreach (collect(self::MODES)->random(2) as $code) {
                $profile->modes()->create(['code' => $code]);
            }

            $profile->educations()->create([
                'degree' => 'Master en psychologie clinique',
                'institution' => 'Université Hassan II',
                'year' => 2010 + random_int(0, 12),
            ]);

            $profile->experiences()->create([
                'role' => 'Psychologue clinicien',
                'organization' => 'Cabinet privé',
                'start_year' => 2015 + random_int(0, 6),
                'end_year' => null,
                'description' => null,
            ]);

            // Monday to Friday, morning and afternoon.
            foreach ([1, 2, 3, 4, 5] as $weekday) {
                $rule = $profile->availabilityRules()->create([
                    'weekday' => $weekday,
                    'enabled' => true,
                ]);
                $rule->ranges()->createMany([
                    ['start_time' => '09:00', 'end_time' => '12:00'],
                    ['start_time' => '14:00', 'end_time' => '18:00'],
                ]);
            }
        });
    }
}
```

The specialty list is transcribed from the `Specialty` union in `src/types/index.ts:20`. Keep it in sync by hand — the marketplace filter chips read from `src/lib/constants.ts`.

- [x] **Step 4: Write the patient seeder**

`database/seeders/PatientSeeder.php`:

```php
<?php

namespace Database\Seeders;

use App\Models\PatientProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PatientSeeder extends Seeder
{
    public function run(): void
    {
        $demo = User::create([
            'role' => 'patient',
            'first_name' => 'Yasmine',
            'last_name' => 'Ouhadi',
            'email' => 'patient@allomonpsy.test',
            'phone' => '+212 6 12 34 56 78',
            'password' => Hash::make('password'),
            'locale' => 'fr',
        ]);
        PatientProfile::create(['user_id' => $demo->id, 'city' => 'Casablanca']);

        PatientProfile::factory()->count(9)->create();
    }
}
```

- [x] **Step 5: Wire the seeders**

`database/seeders/DatabaseSeeder.php`:

```php
public function run(): void
{
    $this->call([
        PsychologistSeeder::class,
        PatientSeeder::class,
    ]);
}
```

- [x] **Step 6: Run the tests and seed the dev database**

```bash
php artisan test --filter=SeederTest
php artisan migrate:fresh --seed
```

Expected: 2 passing, dev database populated.

- [x] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: seeders reproducing the mock volumes"
```

---

## Task 10: Connect the frontend

**Files (frontend repo `C:\laragon\www\allomonpsy`):**
- Create: `src/lib/services/auth-service.ts`, `.env.local`
- Modify: `src/lib/services/index.ts`
- Modify: `src/lib/services/psychologist-service.ts:243-258`
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/dashboard/psychologist/layout.tsx:11`, `page.tsx:51`, `profile/page.tsx:14`, `availability/page.tsx:11`

**Interfaces:**
- Consumes: every endpoint from Tasks 6-8.
- Produces: `authService.login(email, password)`, `.register(input)`, `.logout()`, `.me()`; `psychologistService.current()` replacing the four `getById(CURRENT_PSYCHOLOGIST_ID)` calls.

- [x] **Step 1: Start the API and point the frontend at it**

```bash
cd C:/laragon/www/allomonpsy-api && php artisan serve
```

In `C:\laragon\www\allomonpsy\.env.local`:

```ini
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

- [x] **Step 2: Verify the contract by hand before writing any frontend code**

```bash
curl -s "http://127.0.0.1:8000/api/psychologists?per_page=2" | head -c 600
```

Expected: a `data` array of two objects with `pricePerHour`, `isVerified`, `fullName`, and a `meta` carrying `perPage` and `lastPage`. If any key is snake_case, stop and fix the Resource — do not adapt the frontend.

- [x] **Step 3: Fix the two camelCase request bodies**

`src/lib/services/psychologist-service.ts`, in `register()` and `update()`, replace the raw `payload` pass-through:

```ts
/** The API takes snake_case; the domain type is camelCase. */
function toSnakePayload(payload: Partial<Psychologist>) {
  const { firstName, lastName, yearsOfExperience, pricePerHour, introVideoUrl,
    acceptsNewPatients, responseTimeMinutes, ...rest } = payload;
  return {
    ...rest,
    ...(firstName !== undefined && { first_name: firstName }),
    ...(lastName !== undefined && { last_name: lastName }),
    ...(yearsOfExperience !== undefined && { years_of_experience: yearsOfExperience }),
    ...(pricePerHour !== undefined && { price_per_hour: pricePerHour }),
    ...(introVideoUrl !== undefined && { intro_video_url: introVideoUrl }),
    ...(acceptsNewPatients !== undefined && { accepts_new_patients: acceptsNewPatients }),
    ...(responseTimeMinutes !== undefined && { response_time_minutes: responseTimeMinutes }),
  };
}
```

Then `api.post(ENDPOINTS.psychologists, toSnakePayload(payload))` and the same in `update()`.

- [x] **Step 4: Write the auth service**

`src/lib/services/auth-service.ts`:

```ts
import type { Patient, Psychologist } from '@/types';
import { api, USE_MOCK } from '@/lib/api-client';
import { patientById, CURRENT_PATIENT_ID } from '@/lib/mock/patients';

export type AuthUser = Patient | Psychologist;
export interface AuthResult { token: string; user: AuthUser }

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirmation: string;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResult> {
    if (!USE_MOCK) return api.post<AuthResult>('/login', { email, password });
    return { token: 'mock-token', user: patientById.get(CURRENT_PATIENT_ID)! };
  },

  async register(input: RegisterInput): Promise<AuthResult> {
    if (!USE_MOCK) {
      return api.post<AuthResult>('/register', {
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone,
        password: input.password,
        password_confirmation: input.passwordConfirmation,
      });
    }
    return { token: 'mock-token', user: patientById.get(CURRENT_PATIENT_ID)! };
  },

  async logout(token: string): Promise<void> {
    if (!USE_MOCK) await api.post<void>('/logout', undefined, { token });
  },

  async me(token: string): Promise<AuthUser> {
    if (!USE_MOCK) return api.get<AuthUser>('/me', { token });
    return patientById.get(CURRENT_PATIENT_ID)!;
  },
};
```

Keeping the `USE_MOCK` branch matters: the frontend must still run with the API stopped, exactly as every other service does.

Export it from `src/lib/services/index.ts`:

```ts
export { authService } from './auth-service';
export type { AuthResult, AuthUser, RegisterInput } from './auth-service';
```

- [x] **Step 5: Wire the login page**

In `src/app/(auth)/login/page.tsx`, replace the stubbed submit (the block at `:41` that routes on the role selector) with a real call:

```ts
const result = await authService.login(form.email, form.password);
localStorage.setItem('amp_token', result.token);
router.push(
  result.user.role === 'psychologist' ? '/dashboard/psychologist'
  : result.user.role === 'admin' ? '/admin'
  : '/dashboard/patient',
);
```

On `ApiError` with status 422, surface `error.errors?.email?.[0]` under the email field. Keep the role selector visible only while `USE_MOCK` is true, so the demo still works without a backend.

- [x] **Step 6: Move the own-profile reads to `/me`**

Add to `psychologistService`:

```ts
/** The signed-in practitioner. */
async current(token?: string): Promise<Psychologist> {
  if (!USE_MOCK) return api.get<Psychologist>('/me', { token });
  await delay(80);
  return findPsychologist(CURRENT_PSYCHOLOGIST_ID)!;
},
```

Then replace `psychologistService.getById(CURRENT_PSYCHOLOGIST_ID)` with `psychologistService.current()` in `dashboard/psychologist/layout.tsx:11`, `page.tsx:51`, `profile/page.tsx:14` and `availability/page.tsx:11`. This is required — Task 8 made the public route slug-only.

- [x] **Step 7: Typecheck and verify in the browser**

```bash
cd C:/laragon/www/allomonpsy
npm run typecheck
npm run dev
```

Check by hand, with the API running:

- `/psychologists` — 20 practitioners, 9 per page, 3 pages
- a specialty filter and a language filter, alone and combined
- the price slider and each sort option
- a profile page reached by clicking a card (slug URL)
- `/register` — create an account, confirm the 422 on a duplicate email surfaces
- `/login` with `patient@allomonpsy.test` / `password`
- stop the API, reload `/psychologists`: the mock data must come back

- [x] **Step 8: Commit both repositories**

```bash
cd C:/laragon/www/allomonpsy
git add -A
git commit -m "feat: connect the frontend to the Laravel API"
```

---

## Self-review

**Spec coverage.** Every section of the spec maps to a task: environment and utf8mb4 → Task 1; the six endpoints → Tasks 6-8; the full schema → Tasks 2-4; explicit Resources and the contract guard → Task 5; seeders → Task 9; the three listed frontend changes plus the `/me` migration → Task 10. The spec's two open defaults (nullable `phone`, all approved practitioners listed) are implemented as specified and each is pinned by a test.

**Gap found against the spec.** CORS is absent from the spec and is required for any browser call to succeed; it is implemented in Task 1 and flagged there. The test database `psyapi_testing` is likewise a planning addition.

**Deferred deliberately.** `PaginatedCollection` appears in the file-structure table but Task 7 builds the envelope inline in the controller. One endpoint does not justify the abstraction; extract it when the second paginated endpoint arrives.

**Type consistency.** `PsychologistProfile::specialties()` returns a HasMany of `PsychologistSpecialty` and is read as `->pluck('code')` in both the Resource (Task 5) and the query (Task 7). `AvailabilityRule::ranges()` is used identically in Tasks 4, 5, 8 and 9. `authService` method names in Task 10 match the interfaces block. `PsychologistQuery::apply()` is the only entry point and is called once, from the controller.
