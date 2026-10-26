export type Freq = "daily" | "weekly" | "monthly";
export type Tab = Freq | "invoices";

export const CATEGORIES = ["Chemical", "Roster", "Report", "Invoice", "Operations", "Other"] as const;
export type Category = (typeof CATEGORIES)[number];

export type Priority = "normal" | "high";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  freq: Freq;
  category: Category;
  priority: Priority;
  notes?: string;
  subtasks: Subtask[];
  done: boolean;
  doneAt?: string; // ISO timestamp
}

export interface Invoice {
  id: string;
  name: string;
  month: string; // "YYYY-MM"
  sent: boolean;
  sentAt?: string; // ISO timestamp
}

export interface AppData {
  version: 1;
  tasks: Task[];
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
