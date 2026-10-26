"use client";

import { currentKey, periodLabel, relativeLabel, shiftPeriod } from "@/lib/period";
import type { Freq } from "@/lib/types";

interface Props {
  freq: Freq;
  value: string; // period key
  onChange: (key: string) => void;
  onOpenPicker: () => void;
}

const arrow = "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-200 active:bg-slate-300 dark:text-slate-300 dark:hover:bg-slate-800";

export default function DateNav({ freq, value, onChange, onOpenPicker }: Props) {
  const now = currentKey(freq);
  const rel = relativeLabel(freq, value);
  const unit = freq === "daily" ? "day" : freq === "weekly" ? "week" : "month";

  return (
    <div className="flex items-center gap-1">
      <button type="button" aria-label={`Previous ${unit}`} onClick={() => onChange(shiftPeriod(freq, value, -1))} className={arrow}>
        <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M12.5 4.5L7 10l5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <button
        type="button"
        onClick={onOpenPicker}
        aria-label={`Pick a ${unit}`}
        className="flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-2 hover:bg-slate-200 dark:hover:bg-slate-800"
      >
        <span className="flex items-center gap-1.5 truncate text-[15px] font-semibold">
          {periodLabel(freq, value)}
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 shrink-0 text-slate-400" fill="currentColor" aria-hidden>
            <path d="M5 8l5 5 5-5H5z" />
          </svg>
        </span>
        {rel && <span className={`text-xs ${value === now ? "font-medium text-cyan-700 dark:text-cyan-300" : "text-slate-500 dark:text-slate-400"}`}>{rel}</span>}
      </button>

      <button type="button" aria-label={`Next ${unit}`} onClick={() => onChange(shiftPeriod(freq, value, 1))} className={arrow}>
        <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M7.5 4.5L13 10l-5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {value !== now && (
        <button
          type="button"
          onClick={() => onChange(now)}
          className="ml-1 shrink-0 rounded-lg border border-cyan-600 px-2.5 py-1.5 text-xs font-semibold text-cyan-700 dark:border-cyan-400 dark:text-cyan-300"
        >
          {freq === "daily" ? "Today" : `This ${unit}`}
        </button>
      )}
    </div>
  );
}
