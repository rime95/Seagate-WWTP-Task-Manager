import type { Freq } from "./types";

/*
 * Periods are identified by string keys:
 *   daily   → "YYYY-MM-DD"            (the day)
 *   weekly  → "YYYY-MM-DD"            (the Monday that starts the week)
 *   monthly → "YYYY-MM"
 * All dates are local (no UTC conversion) so the day never shifts with time zones.
 */

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d || 1);
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function mondayOf(d: Date): Date {
  return addDays(d, -((d.getDay() + 6) % 7));
}

export function periodKey(freq: Freq, d: Date): string {
  if (freq === "daily") return toISODate(d);
  if (freq === "weekly") return toISODate(mondayOf(d));
  return toISODate(d).slice(0, 7);
}

export function currentKey(freq: Freq): string {
  return periodKey(freq, new Date());
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** First and last day (inclusive, "YYYY-MM-DD") of a period. */
export function periodRange(freq: Freq, key: string): { start: string; end: string } {
  if (freq === "daily") return { start: key, end: key };
  if (freq === "weekly") return { start: key, end: toISODate(addDays(parseISODate(key), 6)) };
  const first = parseISODate(key + "-01");
  return { start: toISODate(first), end: toISODate(new Date(first.getFullYear(), first.getMonth() + 1, 0)) };
}

export function shiftPeriod(freq: Freq, key: string, n: number): string {
  if (freq === "daily") return toISODate(addDays(parseISODate(key), n));
  if (freq === "weekly") return toISODate(addDays(parseISODate(key), 7 * n));
  const d = parseISODate(key + "-01");
  return periodKey("monthly", new Date(d.getFullYear(), d.getMonth() + n, 1));
}

/** Compare to the current period: -1 past, 0 current, 1 future. */
export function periodWhen(freq: Freq, key: string): -1 | 0 | 1 {
  const now = currentKey(freq);
  return key < now ? -1 : key > now ? 1 : 0;
}

/** ISO-8601 week number of the week starting on this Monday. */
export function isoWeek(mondayKey: string): number {
  const thursday = addDays(parseISODate(mondayKey), 3);
  const jan1 = new Date(thursday.getFullYear(), 0, 1);
  return Math.floor((thursday.getTime() - jan1.getTime()) / 86400000 / 7) + 1;
}

const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString(undefined, o);

export function periodLabel(freq: Freq, key: string): string {
  if (freq === "daily") return fmt(parseISODate(key), { weekday: "short", day: "numeric", month: "short" });
  if (freq === "weekly") {
    const { start, end } = periodRange(freq, key);
    const s = parseISODate(start);
    const e = parseISODate(end);
    return `Week ${isoWeek(key)} · ${fmt(s, { day: "numeric", month: "short" })} – ${fmt(e, { day: "numeric", month: "short" })}`;
  }
  return fmt(parseISODate(key + "-01"), { month: "long", year: "numeric" });
}

/** "Today", "Yesterday", "Last week", "Next month"… or "" when further away. */
export function relativeLabel(freq: Freq, key: string): string {
  const now = currentKey(freq);
  const unit = freq === "daily" ? null : freq === "weekly" ? "week" : "month";
  if (key === now) return unit ? `This ${unit}` : "Today";
  if (key === shiftPeriod(freq, now, -1)) return unit ? `Last ${unit}` : "Yesterday";
  if (key === shiftPeriod(freq, now, 1)) return unit ? `Next ${unit}` : "Tomorrow";
  return "";
}

/** Short phrase for one-off tasks: "today", "this week", "28 Oct", "Week 45"… */
export function onlyLabel(freq: Freq, key: string): string {
  const rel = relativeLabel(freq, key);
  if (rel) return rel.toLowerCase();
  if (freq === "daily") return fmt(parseISODate(key), { day: "numeric", month: "short" });
  if (freq === "weekly") return `week ${isoWeek(key)}`;
  return fmt(parseISODate(key + "-01"), { month: "short", year: "numeric" });
}

export { addDays, mondayOf };
