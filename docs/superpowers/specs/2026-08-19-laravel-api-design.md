# Laravel REST API — design

**Date:** 2026-08-19
**Status:** approved, ready for implementation planning
**Scope of this document:** milestone 1 (auth + profiles) of the backend that
replaces the mock repositories. The remaining domains — appointments, payments,
messaging, subscriptions, admin — are named here only where they constrain
milestone 1.

## Problem

The frontend is complete and runs entirely on seeded mock repositories. Every
service in `src/lib/services` already carries both branches:

```ts
if (!USE_MOCK) return api.get<Paginated<Psychologist>>(ENDPOINTS.psychologists, { … });
// …mock fallback
```

The HTTP branch is written and dormant. Nothing swaps it on because no backend
exists. `NEXT_PUBLIC_API_URL` is the single switch (`src/lib/api-client.ts:14`).

The task is to build that backend as a Laravel REST API, in a separate
repository, without touching a single component.

## Decisions taken

| # | Decision | Rationale |
| --- | --- | --- |
| 1 | Separate repository at `C:\laragon\www\allomonpsy-api` | The frontend README states the backend is not built here. |
| 2 | The **frontend is the contract** | 40 route calls and a full domain type file already exist. Laravel conforms to `src/types/index.ts`, not the reverse. |
| 3 | Laravel 12 + Sanctum personal access tokens | `api-client.ts:60` already sends `Authorization: Bearer`. |
| 4 | `users` + 1-1 profile tables (fork 1-A) | Mirrors `BaseUser` / `Patient extends BaseUser` / `Psychologist extends BaseUser`; one `/login`, one `/me`, one Sanctum table. |
| 5 | Explicit API Resources (fork 2-A) | Only place where the contract is readable against the TS types; handles `self-esteem`; carries derived fields that are not columns. |
| 6 | **snake_case on input**, camelCase on output | Request bodies are already snake_case everywhere except two call sites, which get fixed. |
| 7 | The legacy `allomonpsy` database is ignored | Confirmed by the product owner as an unrelated older project. |
| 8 | Public psychologist route is **slug-only** | Verified: every profile and booking link builds `/psychologists/${p.slug}`; the only id-based caller is the practitioner's own dashboard, which moves to `/me`. |

## Environment

| | |
| --- | --- |
| PHP | 8.2.22 nts — Laravel 12 requires ≥ 8.2 |
| Extensions | `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `curl`, `fileinfo`, `zip`, `bcmath`, `gd` — all present |
| Composer | 2.5.5, **not on PATH** — invoke as `php C:\laragon\bin\composer\composer.phar` |
| MySQL | 5.7.33 (EOL since Oct 2023) |
| Database | `psyapi`, empty |

Two environment items must be handled before the first migration:

1. `psyapi` is **`latin1 / latin1_swedish_ci`**. The platform ships French first
   with Arabic and RTL planned; latin1 cannot store Arabic. Convert to
   `utf8mb4 / utf8mb4_unicode_ci` while the database is still empty.
2. MySQL 5.7 with utf8mb4 requires `Schema::defaultStringLength(191)` in
   `AppServiceProvider`, or unique indexes on string columns fail to migrate.

## Contract details that are easy to get wrong

These are the findings that justify writing this document rather than
improvising against the type file.

**Pagination envelope.** `Paginated<T>` (`src/types/index.ts:607`) expects
`{ data, meta: { total, page, perPage, lastPage } }`. Laravel's paginator emits
`current_page`, `per_page`, `last_page`. A custom meta is mandatory; without it
every list silently renders empty.

**Enum values are not camel-casable.** `Specialty` includes `'self-esteem'`
(hyphen) and `Language` includes `'ary'` and `'ber'`. No automatic case
conversion produces these. This is the decisive argument for decision 5.

**Money is integer centimes** paired with an ISO currency code, everywhere.
Never a float, never a decimal column.

**IDs are strings over JSON.** Resources cast `(string) $this->id`.

**Derived fields that are not columns:** `fullName`, `isVerified`
(`verification_status === 'approved'`), `profileCompletion`, and the
denormalised `rating` / `reviewCount` / `patientCount` / `nextAvailableAt`.

**Request-body casing is inconsistent in the frontend today.** snake_case in
`appointment-service.ts:246`, `payment-service.ts:216`, `patient-service.ts:101`
and others; raw camelCase `Partial<Psychologist>` in
`psychologist-service.ts:243` and `:252`. Decision 6 resolves this by fixing the
two outliers.

## Milestone 1 — scope

**In:** Laravel 12 project, `psyapi` converted to utf8mb4, Sanctum, the
users/patients/psychologists schema including availability and taxonomies, six
endpoints, seeders reproducing the mock volumes, and the frontend actually
connected and verified against it.

**Out:** appointments, payments, messaging, subscriptions, admin, verification
documents, WebRTC.

Two deliberate deviations from mock behaviour, accepted rather than hidden:

- The mock marketplace filters on `isBookable()` — the practitioner's
  subscription (`psychologist-service.ts:29`). Subscriptions are not in this
  milestone, so **every `approved` practitioner is listed**. The subscription
  gate arrives with its own slice.
- `rating`, `reviewCount` and `patientCount` derive from reviews and
  appointments that do not exist yet. They are **denormalised columns**, seeded
  now and maintained by observers later. This keeps the Resource complete and
  allows sorting by rating in SQL rather than in PHP.

## Schema

### `users` — identity and auth only

`id`, `role` enum(patient, psychologist, admin), `first_name`, `last_name`,
`email` unique(191), `phone`, `password`, `avatar_url` null,
`locale` enum(fr, ar, ary, en, es, ber) default fr, `email_verified_at`,
`remember_token`, timestamps.

`fullName` is an accessor rendered by the Resource, not a column.

`phone` is **nullable at the database level but required by the FormRequest**
for both patient and psychologist registration, so an admin account can be
seeded without one. Patient registration made it mandatory on
`src/app/(auth)/register/page.tsx:56`; the psychologist onboarding already
required it (`psychologist-onboarding.tsx:169`).

### `patient_profiles`

`user_id` unique FK, `gender` null, `date_of_birth` null, `city` null,
`notes` null, `appointment_count` default 0.

### `patient_favorites`

Pivot `patient_profile_id` × `psychologist_profile_id`, unique composite.
Feeds `favoritePsychologistIds`.

### `psychologist_profiles`

`user_id` unique FK, `slug` unique, `gender`, `title`, `headline`, `bio`,
`intro_video_url` null, `years_of_experience`, `city`,
`price_per_hour` unsigned int (**centimes**), `currency` char(3) default MAD,
`rating` decimal(2,1), `review_count`, `patient_count`,
`verification_status` enum(draft, pending, approved, rejected, suspended),
`accepts_new_patients`, `response_time_minutes`, `next_available_at` null,
`profile_completion` tinyint, `submitted_at` null, `approved_at` null.

`isVerified` is not stored — it is `verification_status === 'approved'`,
computed in the Resource, so there is one source of truth.

### Taxonomies

`specialties`, `languages`, `approaches` and `modes` are closed sets defined in
TypeScript. Four lightweight pivot tables — `psychologist_specialty
(psychologist_profile_id, code)` and siblings — each with a unique composite
index.

Chosen over JSON columns because MySQL 5.7 indexes JSON poorly and the
marketplace filters (`specialties[]=anxiety&languages[]=ar`) reduce to
`whereHas`. No reference table until an admin needs to edit these labels.

### Psychologist sub-resources

- `educations` — degree, institution, year
- `experiences` — role, organization, start_year, end_year null, description null
- `availability_rules` — weekday tinyint (0 = Sunday), enabled
- `time_ranges` — start_time, end_time, belonging to a rule

`AvailabilityRule.ranges` is a list: a practitioner works several discrete
blocks per day, not one span. The two-table split is required by the type.

Plus Sanctum's `personal_access_tokens`.

## Endpoints

| Route | Notes |
| --- | --- |
| `POST /api/register` | Patient self-registration. Body: `first_name`, `last_name`, `email`, `phone`, `password`, `password_confirmation`. → 201 `{ token, user }` |
| `POST /api/login` | → `{ token, user }`, Resource varying by role |
| `POST /api/logout` | Authenticated; revokes the current token |
| `GET /api/me` | Authenticated → `PatientResource` or `PsychologistResource` |
| `GET /api/psychologists` | `q`, `specialties[]`, `languages[]`, `approaches[]`, `gender`, `min_price`, `max_price`, `min_experience`, `max_experience`, `available_within_days`, `min_rating`, `sort`, `page`, `per_page` (default **9**) |
| `GET /api/psychologists/{slug}` | Slug only — see decision 8 |

The five sorts of `sortList()` (`psychologist-service.ts:60`) must be
reproduced in SQL, including `relevance`: `acceptsNewPatients` first, then
`rating × log10(reviewCount + 10)`.

## Authentication

Sanctum personal access tokens. The token reaches the services through the
`token` option that `apiRequest` already supports.

`/login` is called by **no service today** — the login page is a role selector
that redirects (`src/app/(auth)/login/page.tsx:41`). This milestone therefore
also creates a frontend `authService` and wires the real login page. That is
genuine frontend work, not plumbing, and must be planned as such.

## Frontend changes included in this milestone

1. `src/lib/services/psychologist-service.ts:243` and `:252` — map the payload
   to snake_case explicitly (~10 lines), per decision 6.
2. New `authService` + real login page wiring.
3. The four dashboard calls that read the practitioner's **own** profile by id —
   `psychologistService.getById(CURRENT_PSYCHOLOGIST_ID)` in
   `dashboard/psychologist/layout.tsx:11`, `page.tsx:51`, `profile/page.tsx:14`
   and `availability/page.tsx:11` — must move to `/me`. Decision 8 makes the
   public route slug-only, so these break the moment the API goes live. This is
   a direct consequence of decision 8 and is not optional.
4. `NEXT_PUBLIC_API_URL` set in `.env.local`.

## Verification

Pest feature tests per endpoint: valid registration and 422 on duplicate email,
successful and rejected login, `/me` without a token → 401, each marketplace
filter in isolation, the exact shape of `meta`, and slug resolution.

One test carries more weight than the rest: **compare the JSON emitted by
`PsychologistResource` key by key against `src/types/index.ts`**. It is the only
guard against contract drift, and getting it wrong here is what would make the
remaining 34 routes painful.

Then `NEXT_PUBLIC_API_URL` is set and the marketplace is verified in a real
browser — list, filters, pagination, and a profile page by slug.

## Open questions

None blocking. Two defaults were taken and can be reversed before
implementation:

- `phone` nullable at the database level (required by validation).
- Every `approved` practitioner is listed, pending the subscription slice.
