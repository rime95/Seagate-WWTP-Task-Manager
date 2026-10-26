import type { AppData, Category, Freq, Priority, Task } from "./types";
import { uid } from "./util";

function t(freq: Freq, category: Category, title: string, opts: { priority?: Priority; subtasks?: string[]; notes?: string } = {}): Task {
  return {
    id: uid(),
    title,
    freq,
    category,
    priority: opts.priority ?? "normal",
    notes: opts.notes,
    subtasks: (opts.subtasks ?? []).map((s) => ({ id: uid(), title: s, done: false })),
    done: false,
  };
}

export function seedData(): AppData {
  return {
    version: 1,
    tasks: [
      // Daily
      t("daily", "Chemical", "Check chemical stock levels", {
        priority: "high",
        subtasks: ["Alum / PAC", "Polymer", "NaOH (caustic)", "Chlorine / hypochlorite"],
      }),
      t("daily", "Operations", "Review plant log and alarms"),
      t("daily", "Roster", "Confirm shift attendance against roster"),
      t("daily", "Chemical", "Follow up pending chemical deliveries"),

      // Weekly
      t("weekly", "Chemical", "Plan chemical orders and raise PR", { priority: "high" }),
      t("weekly", "Roster", "Prepare next week's job roster"),
      t("weekly", "Invoice", "Check invoices received from vendors"),
      t("weekly", "Report", "Review lab and effluent results"),

      // Monthly
      t("monthly", "Report", "Compile monthly report", {
        priority: "high",
        subtasks: ["Effluent quality / compliance", "Chemical consumption", "Power usage", "Sludge disposal"],
      }),
      t("monthly", "Invoice", "Send all invoices to Finance", { priority: "high" }),
      t("monthly", "Roster", "Prepare next month's roster and leave plan"),
      t("monthly", "Chemical", "Chemical inventory count"),
    ],
    invoices: [],
  };
}
