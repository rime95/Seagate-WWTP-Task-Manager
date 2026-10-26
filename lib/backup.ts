import { CATEGORIES, type AppData, type Invoice, type Task } from "./types";

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

function isTask(v: unknown): v is Task {
  const o = v as Task;
  return (
    !!o &&
    isStr(o.id) &&
    isStr(o.title) &&
    ["daily", "weekly", "monthly"].includes(o.freq) &&
    (CATEGORIES as readonly string[]).includes(o.category) &&
    typeof o.done === "boolean"
  );
}

function isInvoice(v: unknown): v is Invoice {
  const o = v as Invoice;
  return !!o && isStr(o.id) && isStr(o.name) && isStr(o.month) && typeof o.sent === "boolean";
}

/** Validates and normalises parsed JSON. Throws with a readable message if invalid. */
export function parseBackup(raw: unknown): AppData {
  const o = raw as Partial<AppData>;
  if (!o || typeof o !== "object" || !Array.isArray(o.tasks) || !Array.isArray(o.invoices)) {
    throw new Error("This file is not a WWTP Tasks backup.");
  }
  if (!o.tasks.every(isTask) || !o.invoices.every(isInvoice)) {
    throw new Error("The backup file contains invalid items.");
  }
  return {
    version: 1,
    tasks: o.tasks.map((t) => ({
      ...t,
      priority: t.priority === "high" ? "high" : "normal",
      subtasks: Array.isArray(t.subtasks) ? t.subtasks.filter((s) => s && isStr(s.id) && isStr(s.title)) : [],
    })),
    invoices: o.invoices,
  };
}
