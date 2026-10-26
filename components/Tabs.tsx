"use client";

import type { Tab } from "@/lib/types";

const TABS: { id: Tab; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "invoices", label: "Invoices" },
];

export default function Tabs({ active, counts, onChange }: { active: Tab; counts: Record<Tab, number>; onChange: (t: Tab) => void }) {
  return (
    <nav className="sticky top-0 z-20 -mx-4 bg-slate-50/90 px-4 py-2 backdrop-blur dark:bg-slate-950/90" role="tablist">
      <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800/70">
        {TABS.map((t) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onChange(t.id)}
              className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-1 text-sm font-medium transition ${
                on ? "bg-white text-cyan-700 shadow-sm dark:bg-slate-900 dark:text-cyan-300" : "text-slate-600 dark:text-slate-400"
              }`}
            >
              {t.label}
              {counts[t.id] > 0 && (
                <span
                  className={`min-w-5 rounded-full px-1.5 text-xs leading-5 ${
                    on ? "bg-cyan-600 text-white" : "bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                  }`}
                >
                  {counts[t.id]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
