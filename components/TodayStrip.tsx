"use client";

import { useState } from "react";
import { FREQ_LABEL, type TaskEntry } from "@/lib/types";
import Checkbox from "./Checkbox";

interface Props {
  tasks: TaskEntry[]; // open, high-priority tasks in the current day/week/month
  unsentInvoices: number;
  onToggle: (t: TaskEntry) => void;
  onOpenInvoices: () => void;
}

/** "My Day"-style focus strip: high-priority items still open across every tab. */
export default function TodayStrip({ tasks, unsentInvoices, onToggle, onOpenInvoices }: Props) {
  const [open, setOpen] = useState(true);
  const total = tasks.length + (unsentInvoices > 0 ? 1 : 0);
  if (total === 0) return null;

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left"
      >
        <span className="text-sm font-semibold text-amber-900 dark:text-amber-200">
          ★ Today’s focus{tasks.length > 0 && ` · ${tasks.length} high-priority open`}
        </span>
        <svg viewBox="0 0 20 20" className={`h-4 w-4 text-amber-700 transition-transform ${open ? "rotate-180" : ""}`} fill="currentColor">
          <path d="M5 8l5 5 5-5H5z" />
        </svg>
      </button>
      {open && (
        <ul className="space-y-2 px-4 pb-3">
          {tasks.map((t) => (
            <li key={t.id} className="flex items-center gap-2.5">
              <Checkbox size="sm" checked={false} onChange={() => onToggle(t)} label={`Mark "${t.title}" done`} />
              <span className="flex-1 text-sm">{t.title}</span>
              <span className="text-xs text-amber-700/80 dark:text-amber-300/70">{FREQ_LABEL[t.freq]}</span>
            </li>
          ))}
          {unsentInvoices > 0 && (
            <li>
              <button type="button" onClick={onOpenInvoices} className="text-sm font-medium text-amber-800 underline underline-offset-2 dark:text-amber-300">
                {unsentInvoices} invoice{unsentInvoices > 1 ? "s" : ""} not yet sent to Finance →
              </button>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
