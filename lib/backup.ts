import { currentKey, todayISO } from "./period";
import { CATEGORIES, type AppData, type Check, type Invoice, type Task } from "./types";

export function exportData(data: AppData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wwtp-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const isStr = (v: unknown): v is string => typeof v === "string";
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

function baseTaskOk(o: Record<string, unknown>): boolean {
  return (
    isStr(o.id) &&
    isStr(o.title) &&
    ["daily", "weekly", "monthly"].includes(o.freq as string) &&
    (CATEGORIES as readonly string[]).includes(o.category as string)
  );
}

function isInvoice(v: unknown): v is Invoice {
  return isObj(v) && isStr(v.id) && isStr(v.name) && isStr(v.month) && typeof v.sent === "boolean";
}

function cleanSubtasks(v: unknown): { id: string; title: string; done?: boolean }[] {
  return Array.isArray(v) ? v.filter((s) => isObj(s) && isStr(s.id) && isStr(s.title)) : [];
}

/** Version 1 stored a single done flag per task. Carry ticks over into the current period. */
function migrateV1(tasks: Record<string, unknown>[], invoices: Invoice[]): AppData {
  const checks: AppData["checks"] = {};
  const out: Task[] = tasks.map((o) => {
    const subs = cleanSubtasks(o.subtasks);
    const t = o as unknown as Task;
    const key = currentKey(t.freq);
    const doneSubs = subs.filter((s) => s.done).map((s) => s.id);
    if (o.done === true || doneSubs.length) {
      checks[t.id] = { [key]: { at: o.done === true ? (isStr(o.doneAt) ? o.doneAt : new Date().toISOString()) : undefined, subs: doneSubs } };
    }
    return {
      id: t.id,
      title: t.title,
      freq: t.freq,
      category: t.category,
      priority: o.priority === "high" ? "high" : "normal",
      notes: isStr(o.notes) ? o.notes : undefined,
      subtasks: subs.map(({ id, title }) => ({ id, title })),
      start: todayISO(),
    };
  });
  return { version: 2, tasks: out, checks, invoices };
}

/** Validates and normalises parsed JSON (version 1 or 2). Throws with a readable message if invalid. */
export function parseBackup(raw: unknown): AppData {
  if (!isObj(raw) || !Array.isArray(raw.tasks) || !Array.isArray(raw.invoices)) {
    throw new Error("This file is not a WWTP Tasks backup.");
  }
  const tasks = raw.tasks as unknown[];
  if (!tasks.every((t) => isObj(t) && baseTaskOk(t)) || !raw.invoices.every(isInvoice)) {
    throw new Error("The backup file contains invalid items.");
  }
  const invoices = raw.invoices as Invoice[];
  if (raw.version !== 2) return migrateV1(tasks as Record<string, unknown>[], invoices);

  const checks: AppData["checks"] = {};
  if (isObj(raw.checks)) {
    for (const [id, byKey] of Object.entries(raw.checks)) {
      if (!isObj(byKey)) continue;
      checks[id] = {};
      for (const [key, c] of Object.entries(byKey)) {
        if (!isObj(c)) continue;
        const check: Check = {};
        if (isStr(c.at)) check.at = c.at;
        if (Array.isArray(c.subs)) check.subs = c.subs.filter(isStr);
        if (isStr(c.note)) check.note = c.note;
        checks[id][key] = check;
      }
    }
  }
  return {
    version: 2,
    tasks: (tasks as Record<string, unknown>[]).map((o) => {
      const t = o as unknown as Task;
      return {
        id: t.id,
        title: t.title,
        freq: t.freq,
        category: t.category,
        priority: o.priority === "high" ? "high" : "normal",
        notes: isStr(o.notes) ? o.notes : undefined,
        subtasks: cleanSubtasks(o.subtasks).map(({ id, title }) => ({ id, title })),
        start: isStr(o.start) ? o.start : todayISO(),
        end: isStr(o.end) ? o.end : undefined,
        once: isStr(o.once) ? o.once : undefined,
      };
    }),
    checks,
    invoices,
  };
}
