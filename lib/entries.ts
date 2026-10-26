import { currentKey, periodRange, periodWhen } from "./period";
import type { AppData, Freq, Task, TaskEntry } from "./types";

/**
 * Weekly and monthly tasks keep a note per period. A period without its own note shows the latest earlier
 * period's note (carried forward); the task's base note is the fallback before any period note exists.
 */
export function periodNoteFor(data: AppData, task: Task, key: string): { note?: string; from?: string } {
  if (task.freq === "daily") return {};
  const byKey = data.checks[task.id] ?? {};
  if (byKey[key]?.note !== undefined) return { note: byKey[key].note };
  const earlier = Object.keys(byKey)
    .filter((k) => k < key && byKey[k].note !== undefined)
    .sort();
  const from = earlier.at(-1);
  if (from) return { note: byKey[from].note, from };
  return { note: task.notes };
}

/** Does this task appear in the given period? */
export function isVisible(task: Task, freq: Freq, key: string): boolean {
  if (task.freq !== freq) return false;
  if (task.once) return task.once === key;
  const { end } = periodRange(freq, key);
  return task.start <= end && (!task.end || task.end > end);
}

/** Tasks for one tab + period, merged with that period's ticks. */
export function entriesFor(data: AppData, freq: Freq, key: string): TaskEntry[] {
  return data.tasks
    .filter((t) => isVisible(t, freq, key))
    .map((t) => {
      const check = data.checks[t.id]?.[key];
      const subs = check?.subs ?? [];
      const pn = periodNoteFor(data, t, key);
      return {
        ...t,
        periodKey: key,
        done: !!check?.at,
        doneAt: check?.at,
        subtasks: t.subtasks.map((s) => ({ ...s, done: subs.includes(s.id) })),
        periodNote: pn.note || undefined,
        noteFrom: pn.note ? pn.from : undefined,
      };
    });
}

export type PeriodStatus = "done" | "missed" | "open" | "none";

/** Summary used for calendar dots: all done, missed (past + something undone), still open, or nothing scheduled. */
export function periodStatus(data: AppData, freq: Freq, key: string): PeriodStatus {
  const entries = entriesFor(data, freq, key);
  if (entries.length === 0) return "none";
  if (entries.every((e) => e.done)) return "done";
  return periodWhen(freq, key) < 0 ? "missed" : "open";
}

/** Open tasks in the current period of each tab (for tab badges and the focus strip). */
export function currentEntries(data: AppData, freq: Freq): TaskEntry[] {
  return entriesFor(data, freq, currentKey(freq));
}
