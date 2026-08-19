/**
 * Deterministic helpers for the mock dataset.
 *
 * Everything must be reproducible: Next renders on the server and hydrates on
 * the client, so `Math.random()` at module scope would produce two different
 * datasets and a hydration mismatch. A seeded PRNG plus a day-anchored clock
 * keeps both passes identical while still letting dashboards say "today".
 */

/** mulberry32 — small, fast, and stable across runtimes. */
export function createRng(seed: number) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rng = createRng(20260812);

export function pick<T>(items: readonly T[], r: () => number = rng): T {
  return items[Math.floor(r() * items.length)]!;
}

export function pickMany<T>(items: readonly T[], count: number, r: () => number = rng): T[] {
  const pool = [...items];
  const out: T[] = [];
  for (let i = 0; i < count && pool.length; i++) {
    out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]!);
  }
  return out;
}

export function int(min: number, max: number, r: () => number = rng) {
  return Math.floor(r() * (max - min + 1)) + min;
}

/** Midnight today, in local time — the anchor every relative date hangs off. */
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMinutes(date: Date, minutes: number) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}

export function atTime(date: Date, hours: number, minutes = 0) {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export function iso(date: Date) {
  return date.toISOString();
}

/** Stable, human-looking portraits without depending on a photo CDN's ids. */
export function avatar(n: number) {
  return `https://i.pravatar.cc/320?img=${n}`;
}
