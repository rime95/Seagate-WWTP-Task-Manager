export type Freq = "daily" | "weekly" | "monthly";
export type Tab = Freq | "invoices";

export const CATEGORIES = ["Chemical", "Roster", "Report", "Invoice", "Operations", "Other"] as const;
export type Category = (typeof CATEGORIES)[number];

export type Priority = "normal" | "high";

/** A task template. Ticks are stored per period in AppData.checks, not on the task. */
export interface Task {
  id: string;
  title: string;
  freq: Freq;
  category: Category;
  priority: Priority;
  notes?: string;
  subtasks: { id: string; title: string }[];
  start: string; // "YYYY-MM-DD": first day the task appears
  end?: string; // "YYYY-MM-DD": removed on this day (kept for history before it)
  once?: string; // one-off task: the only period key it appears in
}

/** Tick state of one task in one period. */
export interface Check {
  at?: string; // ISO timestamp when the task was ticked; absent = not done
  subs?: string[]; // ids of ticked subtasks
  note?: string; // weekly/monthly note for this period ("" = cleared); later periods inherit it until changed
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

/** A task as shown for one period (template + that period's ticks). */
export interface TaskEntry extends Omit<Task, "subtasks"> {
  periodKey: string;
  done: boolean;
  doneAt?: string;
  subtasks: Subtask[];
  /** Weekly/monthly: the note for this period, or carried over from the latest earlier period that has one. */
  periodNote?: string;
  /** Period key the note was carried over from (absent when it was written for this period). */
  noteFrom?: string;
}

export interface Invoice {
  id: string;
  name: string;
  month: string; // "YYYY-MM"
  sent: boolean;
  sentAt?: string; // ISO timestamp
}

export interface AppData {
  version: 2;
  tasks: Task[];
  checks: Record<string, Record<string, Check>>; // taskId → periodKey → Check
  invoices: Invoice[];
}

export const FREQ_LABEL: Record<Freq, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

// Tailwind classes per category (chip background + text, and a left accent bar).
export const CATEGORY_STYLE: Record<Category, { chip: string; bar: string }> = {
  Chemical: { chip: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200", bar: "bg-blue-500" },
  Roster: { chip: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200", bar: "bg-green-500" },
  Report: { chip: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200", bar: "bg-purple-500" },
  Invoice: { chip: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200", bar: "bg-amber-500" },
  Operations: { chip: "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200", bar: "bg-teal-500" },
  Other: { chip: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200", bar: "bg-slate-400" },
};
