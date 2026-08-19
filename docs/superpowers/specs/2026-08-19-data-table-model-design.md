# Shared data-table model — design

**Date:** 2026-08-19
**Status:** approved, ready for implementation planning

## Problem

Nine browsable tables exist across the three dashboards. Five (admin) have
search and pagination; four do not, and each of those four solves — or skips —
the problem its own way:

| Table | File | Search | Pagination |
| --- | --- | --- | --- |
| Admin appointments | `components/admin/appointments-table.tsx` | yes | yes |
| Admin patients | `components/admin/patients-table.tsx` | yes | yes |
| Admin payments | `components/admin/payments-table.tsx` | yes | yes |
| Admin subscriptions | `components/admin/subscriptions-table.tsx` | yes | yes |
| Admin verifications | `components/admin/verification-table.tsx` | yes | yes |
| Psychologist patients | `components/dashboard/patient-table.tsx` | client filter | **no** |
| Psychologist earnings | `app/dashboard/psychologist/earnings/page.tsx` | **no** | **no** |
| Psychologist invoices | `app/dashboard/psychologist/invoices/page.tsx` | **no** | **no** |
| Patient payments | `app/dashboard/patient/payments/page.tsx` | **no** | **no** |

The working pattern — `useTableQuery` + `TableToolbar` + `Pagination` +
`EmptyState` + `ResultSummary` — already exists, but lives in
`src/components/admin/table-toolbar.tsx`. Nothing about it is admin-specific;
its location is the only reason the other four tables cannot use it.

Two tables are deliberately **out of scope**:

- **Subscription invoice history** (`components/payment/subscription-panel.tsx`)
  — a three-row billing history inside a panel, not a browsable dataset. A
  search box and pager there would be noise.
- **Invoice line items** (`components/payment/consultation-invoice.tsx`) — the
  billable lines of a printed document. It is a table element, not a data table.

## Goals

1. One table model, used by all nine browsable tables.
2. Search and pagination on every one of them.
3. No regression in what the existing tables render per cell — avatars, status
   badges, struck-through prices and action icons all survive the migration.

## Non-goals

- URL-driven (`?q=&page=`) state. Considered and deferred: it is better for
  reload, back-button and shareable links, but adopting it means migrating the
  five working admin tables to a second new pattern in the same change. Client
  state keeps this migration to one pattern shift, not two.
- A config-driven `columns={[...]}` table. Considered and rejected: every
  existing table's custom cells would have to be rewritten as render functions,
  turning a chrome swap into a full rewrite of ~1,400 lines of cell markup.
- Sorting, column visibility, row selection, CSV export. Not asked for.

## Architecture

### 1. `src/components/ui/data-table.tsx` — the model

`useTableQuery`, `TableToolbar` and `ResultSummary` move here unchanged in
behaviour. `src/components/admin/table-toolbar.tsx` becomes a re-export for the
duration of the migration, then is deleted once no import remains.

**`<DataTable>`** owns the chrome so no table repeats it:

```tsx
<DataTable
  toolbar={{ search, onSearchChange: setSearch, placeholder: 'Référence, patient…' }}
  headers={['Référence', 'Patient', 'Montant', 'Statut']}
  meta={result.meta}
  onPageChange={setPage}
  noun="facture"
  loading={loading}
  empty={{ icon: SearchX, title: 'Aucune facture', description: '…' }}
  minWidth={820}
>
  {result.data.map((invoice) => (
    <tr key={invoice.id}>…</tr>
  ))}
</DataTable>
```

It renders, in order: toolbar → result summary → `Card` wrapping an
`overflow-x-auto` scroll container → `<table>` with the `<thead>` built from
`headers` → `<tbody>` holding `children` → `Pagination`. When `loading` is true
it renders the existing loading card; when `meta.total` is 0 it renders
`EmptyState` in place of the table.

**The date-range filter is optional.** `TableToolbar` currently requires `range`
and `onRangeChange`; on the shared model they become optional, and the period
`Select` renders only when a caller passes them. The five admin tables and
earnings/invoices/patient-payments filter by period; the psychologist patients
table has no meaningful date to filter on and passes neither. `ResultSummary`
likewise omits the period segment when no range is supplied.

**`perPage` defaults to 12** — the value the admin tables already use — and is
overridable per table.

Children stay raw `<tr>` markup on purpose. That is what makes this a chrome
swap rather than a rewrite, and it keeps each table's per-cell rendering local
to the table that owns it.

**`useTableQuery()`** — search, date range and page, with page reset to 1 on any
filter change (page 4 of the old result set rarely exists in the new one). One
behavioural change: search is **debounced ~250ms**. The admin tables currently
issue a service call per keystroke.

Two values are exposed, not one: `search` (immediate, bound to the input so
typing stays responsive) and `debouncedSearch` (what callers pass to the
service). Binding the input to the debounced value would make it feel laggy.

**`useLocalTableQuery(rows, { fields, perPage })`** — filters and paginates an
in-memory array, returning `{ data, meta }` in the same shape as `Paginated<T>`.

This exists because the nine tables come in two flavours: eight fetch a
`Paginated<T>` from a service, while the psychologist patients table receives a
plain array as props. Without it, that table could not use `<DataTable>` at all.
With it, both flavours hand `<DataTable>` the identical `meta` shape and the
component never learns where the rows came from.

### 2. Service layer — search must exist before it can be searched

`PaymentQuery` and `InvoiceQuery` gain `q`, `from` and `to`. Today neither
supports any of them, so three of the four gap tables have nothing to search
against; this is a prerequisite, not a nice-to-have.

Matching is case-insensitive and accent-insensitive — normalising with `NFD` and
stripping combining marks, the approach `slugify` in `src/lib/utils.ts` already
uses — so "Sofia" matches "Sofía". It runs over the fields a user would actually
type:

- **Payments** — payment reference, counterparty full name, appointment reference.
- **Invoices** — invoice reference, `billedTo.fullName`, appointment reference.

`from`/`to` filter on `createdAt` for payments and `issuedAt` for invoices,
reusing `withinRange` from `src/lib/date-range.ts`.

Both `!USE_MOCK` branches pass `q`, `from` and `to` through as request params, so
the documented Laravel contract stays honest about what the backend must
implement.

### 3. Migrations

**Gap tables (4):**

- `app/dashboard/psychologist/invoices/page.tsx` — table subtree extracted to a
  client `InvoicesTable`; page keeps its KPI tiles server-rendered.
- `app/dashboard/psychologist/earnings/page.tsx` — same, over payment reference
  and patient name.
- `app/dashboard/patient/payments/page.tsx` — same, over reference and
  psychologist name.
- `components/dashboard/patient-table.tsx` — keeps its props-fed array, replaces
  its hand-rolled search input with `<DataTable>` driven by
  `useLocalTableQuery`, and gains pagination it never had.

**Admin tables (5):** replace hand-rolled toolbar / `Card` / `<table>` /
`Pagination` with `<DataTable>`. Per-cell markup is copied across untouched.
Each table's extra filters (status chips, verification state) pass through
`toolbar.children`, which `TableToolbar` already supports.

### 4. Server-to-client conversion

Earnings, invoices and patient payments are server components that render their
tables inline. Search and pagination need client state, so the table subtree
becomes a client component that fetches through the service layer. Page headers
and KPI tiles stay server-rendered.

**Accepted trade-off:** those three tables lose server-rendered first paint and
briefly show a loading state. The five admin tables already behave this way, so
this makes the app consistent rather than introducing a new behaviour.

## Data flow

```
useTableQuery ──> debouncedSearch, range, page
      │
      ├─ service-fed (8 tables)
      │     └─> service.list({ q, from, to, page, perPage }) ──> Paginated<T>
      │
      └─ props-fed (1 table)
            └─> useLocalTableQuery(rows, { fields, perPage }) ──> { data, meta }
                                                                       │
                                          <DataTable meta={…}> <────────┘
```

`<DataTable>` receives the same `meta` shape from both paths and stays unaware
of the source.

## Error and empty states

- **No rows at all** (a practitioner with no invoices yet) — the page's own
  `EmptyState` with its call to action, unchanged. `<DataTable>` is not rendered.
- **No rows for the current filters** — `<DataTable>` renders `EmptyState` with a
  "widen the period or clear the search" description, keeping the toolbar mounted
  so the search can be cleared. Losing the toolbar here would trap the user.
- **Fetch failure** — services already resolve to empty results rather than
  throwing; the filtered-empty state covers it.
- **Stale responses** — each effect keeps the existing `cancelled` guard so a
  slow response for an old query cannot overwrite a newer one.

## Testing and verification

The project has no test runner, and none is being added as part of this work.
Verification is:

1. `npm run typecheck` clean.
2. `npm run build` clean, all routes present.
3. Each of the nine tables exercised over HTTP: a search term narrows the row
   count, page 2 returns a different row set, a nonsense search shows the
   filtered-empty state with the toolbar still present.

`useLocalTableQuery` is a pure function of `(rows, query)` and is the natural
first unit test if a runner is added later.

## Risks

- **Largest change in this codebase so far** — nine tables, ~1,400 lines. The
  five admin tables currently work; migrating them is churn whose only payoff is
  removing duplicated wiring. Splitting the work (four gap tables first, admin as
  a follow-up) was offered and declined.
- **Regression surface is per-cell markup.** Mitigated by copying cell markup
  verbatim rather than reauthoring it.
- **Debounced search is a behaviour change for admin**, not just a refactor.
  Intentional, and called out here so it is not mistaken for a bug.
