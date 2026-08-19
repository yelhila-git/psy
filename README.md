# AlloMonPsy — Frontend

Next.js frontend for a multi-psychologist online therapy marketplace. Patients
search and book verified practitioners, practitioners self-register and manage
their practice, and an admin team moderates the platform.

The backend is **not** built here. Every screen runs on mock data behind a
service layer designed to be swapped for a Laravel REST API without touching a
single component.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # tsc --noEmit
```

---

## Design system

The visual identity is extracted from the Figma source of truth
([Allomnpsy-Homepage-10-23](https://www.figma.com/design/Q7HO07jg6S3BWMVTj33Ho8/Allomnpsy-Homepage-10-23)),
not invented. Values below were measured across the file's 366 text nodes and
~700 fills rather than eyeballed from a screenshot.

| Token | Value | Where it came from |
| --- | --- | --- |
| `--primary` | `#2A939E` teal | 79 fills + 57 strokes — buttons, links, eyebrow labels |
| `--secondary` | `#263159` navy | 82 fills — headings, dark bands, footer |
| `--accent` | `#10AA9B` mint | the shadow tint and secondary CTAs |
| `--muted-foreground` | `#5D6D8F` | body copy and inactive navigation |
| `--subtle-foreground` | `#92929D` | metadata, timestamps |
| `--surface` | `#E3F5F9` | page background behind cards |
| `--surface-alt` | `#F5F8FD` | alternating section background |
| `--border` / `--border-strong` | `#E4EAF2` / `#CBE6EC` | dividers / chip outlines |
| `--success` `--warning` `--error` | `#00B212` `#FF9500` `#DA0808` | status colours |

Other extracted decisions:

- **Radius** — 5px on controls (47 occurrences), 10px on cards (18), pills for chips.
- **Shadow** — `0 4px 20px rgba(16,170,155,.10)`. The signature card shadow is
  *teal-tinted*, not neutral grey; it appears 30 times in the file and is the
  single most recognisable detail of the identity.
- **Type** — Heebo (400/500/700/900) for everything, Poppins for dashboard
  navigation labels. Ramp: 12 / 13 / 14 / 16 / 21 / 25 / 28 / 40 / 50 / 80.
  Body text is 14px on a 22px line height, which is why `text-base` is 14px here
  rather than Tailwind's default 16px.
- **Layout** — 1280px content column inside a 1425px frame.

All tokens live in `src/app/globals.css` and are consumed exclusively through
Tailwind's semantic names (`bg-primary`, `text-muted-foreground`, `shadow-card`).
No component hardcodes a hex value, so retheming or adding a dark mode is a token
edit. A dark palette is already declared under `.dark`.

---

## Architecture

```
src/
  app/
    (public)/          marketing + marketplace + booking (navbar & footer shell)
    (auth)/            login, register, 6-step psychologist onboarding
    dashboard/patient/
    dashboard/psychologist/
    admin/
    consultation/      full-viewport video room (no dashboard chrome)
  components/
    ui/                primitives — button, input, select, dialog, tabs, toast…
    layout/            navbar, footer, logo
    home/              homepage sections
    psychologists/     card, filters, marketplace, reviews
    booking/           calendar, booking flow, checkout
    dashboard/         shell, sidebar, stat cards, appointment cards, tables
    video/             consultation room + controls
    chat/              two-pane messenger
    admin/             verification queue, platform settings
  lib/
    mock/              seeded fixtures: 20 psychologists, 10 patients, …
    services/          the only data surface components import from
  types/               domain contracts
```

### Data layer

Components never import mock data directly — they call a service:

```ts
import { psychologistService, appointmentService } from '@/lib/services';

const { data, meta } = await psychologistService.list({ specialties: ['anxiety'] });
```

Each service checks `USE_MOCK` (derived from `NEXT_PUBLIC_API_URL`) and resolves
either from `src/lib/mock` or from the Laravel API. Both branches already exist
in every method — the mock one is live, the HTTP one is written and dormant.

**To connect Laravel**, set one variable:

```bash
NEXT_PUBLIC_API_URL=https://api.allomonpsy.com/api
```

Expected endpoints are catalogued in `ENDPOINTS` (`src/lib/api-client.ts`):

```
GET    /psychologists              ?q&specialties[]&languages[]&min_price&sort&page
GET    /psychologists/{id}
GET    /psychologists/{id}/slots   ?date=YYYY-MM-DD&duration=60
GET    /psychologists/{id}/reviews
POST   /psychologists              psychologist self-registration
GET    /appointments               ?patient_id&psychologist_id&scope&status[]
POST   /appointments
PATCH  /appointments/{id}
GET    /payments  ·  POST /payments  ·  POST /payments/{id}/refund
GET    /conversations  ·  GET|POST /conversations/{id}/messages
GET    /admin/stats  ·  GET /admin/verifications
POST   /admin/psychologists/{id}/verification
```

Paginated responses use Laravel's `{ data, meta: { total, page, perPage, lastPage } }`
envelope, so the shape survives the swap unchanged.

### Mock data

Fixtures are generated from a seeded PRNG (`src/lib/mock/seed.ts`) rather than
`Math.random()`. Next renders on the server and hydrates on the client; an
unseeded generator would produce two different datasets and a hydration
mismatch. Dates hang off a day-anchored clock so "today's appointments" stays
meaningful without any hardcoded date.

Money is stored in **centimes** everywhere and paired with a currency code —
never a float.

---

## Conventions worth knowing

- **RTL** — the platform ships French first, with Arabic and English to follow.
  Layouts use logical properties throughout (`ms-`, `me-`, `ps-`, `pe-`,
  `start-`, `end-`), so `dir="rtl"` mirrors the whole UI without per-component
  work. The language switcher in the navbar and in Settings flips `dir` live.
  Cairo is loaded for Arabic glyph coverage.
- **Responsive** — desktop is designed at 1440, tablet at 1024, mobile at 390.
  Mobile is not a scaled-down desktop: the navbar becomes a full drawer, the
  marketplace filters become a sheet, the messenger swaps panes instead of
  splitting, and the weekly agenda becomes a day-by-day list.
- **States** — every async surface has a real loading skeleton matching the final
  layout's dimensions, and every empty state names what is missing and offers a
  way out.
- **Video** — `/consultation/[id]` is **UI only**, deliberately. WebRTC is not
  wired in. `ConsultationRoom` drives waiting / connecting / active / ended from
  local state so the layout and every call state can be reviewed first; the two
  `VideoSurface` bodies are the seams where `MediaStream` elements go.
- **Auth** — stubbed. `/login` has a role selector that routes to the matching
  dashboard so all three spaces are reachable in the demo. Replace with a token
  exchange against `POST /login`.

## Known gaps

These are intentional, not oversights:

- No real authentication, session or route protection.
- No WebRTC transport in the consultation room.
- Payments simulate a successful charge; no PSP integration.
- Translation files do not exist yet — copy is French, and the locale switcher
  changes direction and `lang` but not strings. Wiring `next-intl` is a drop-in
  next step.
- A Windows-specific webpack alias is declared in `next.config.mjs`: Next's
  tsconfig-derived `@/*` alias fails to resolve for files inside parenthesised
  route groups on Windows, so the alias is set explicitly.
