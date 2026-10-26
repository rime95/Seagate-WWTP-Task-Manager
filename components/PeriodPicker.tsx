"use client";

import { useState } from "react";
import type { PeriodStatus } from "@/lib/entries";
import { addDays, currentKey, isoWeek, mondayOf, parseISODate, periodKey, toISODate } from "@/lib/period";
import type { Freq } from "@/lib/types";
import Sheet from "./Sheet";

interface Props {
  freq: Freq;
  value: string;
  statusOf: (key: string) => PeriodStatus;
  onPick: (key: string) => void;
  onClose: () => void;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DOT: Record<PeriodStatus, string> = {
  done: "bg-emerald-500",
  missed: "bg-rose-500",
  open: "bg-transparent",
  none: "bg-transparent",
};

function Dot({ status }: { status: PeriodStatus }) {
  return <span className={`mx-auto mt-0.5 block h-1.5 w-1.5 rounded-full ${DOT[status]}`} aria-hidden />;
}

function NavHeader({ label, onPrev, onNext }: { label: string; onPrev: () => void; onNext: () => void }) {
  const btn = "rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800";
  return (
    <div className="mb-3 flex items-center justify-between">
      <button type="button" onClick={onPrev} aria-label="Previous" className={btn}>
        <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M12.5 4.5L7 10l5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <span className="text-sm font-semibold">{label}</span>
      <button type="button" onClick={onNext} aria-label="Next" className={btn}>
        <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M7.5 4.5L13 10l-5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

/** Calendar for picking a day or week, or a year grid for picking a month. Dots show done / missed. */
export default function PeriodPicker({ freq, value, statusOf, onPick, onClose }: Props) {
  const initial = parseISODate(freq === "monthly" ? value + "-01" : value);
  const [cursor, setCursor] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const pick = (k: string) => {
    onPick(k);
    onClose();
  };

  const title = freq === "daily" ? "Pick a day" : freq === "weekly" ? "Pick a week" : "Pick a month";
  const today = toISODate(new Date());

  let body: React.ReactNode;
  if (freq === "monthly") {
    const year = cursor.getFullYear();
    const now = currentKey("monthly");
    body = (
      <>
        <NavHeader label={String(year)} onPrev={() => setCursor(new Date(year - 1, 0, 1))} onNext={() => setCursor(new Date(year + 1, 0, 1))} />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }, (_, m) => {
            const key = periodKey("monthly", new Date(year, m, 1));
            const selected = key === value;
            return (
              <button
                key={key}
                type="button"
                onClick={() => pick(key)}
                aria-pressed={selected}
                className={`rounded-xl py-3 text-sm ${
                  selected ? "bg-cyan-600 font-semibold text-white" : key === now ? "font-semibold text-cyan-700 ring-1 ring-cyan-600 dark:text-cyan-300" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {new Date(year, m, 1).toLocaleDateString(undefined, { month: "short" })}
                <Dot status={statusOf(key)} />
              </button>
            );
          })}
        </div>
      </>
    );
  } else {
    const first = mondayOf(cursor);
    const weeks = Array.from({ length: 6 }, (_, w) => addDays(first, w * 7)).filter(
      (monday, i) => i < 4 || monday.getMonth() === cursor.getMonth(),
    );
    body = (
      <>
        <NavHeader
          label={cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          onPrev={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          onNext={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
        />
        <div className="grid grid-cols-[2.5rem_repeat(7,1fr)] gap-y-1 text-center text-xs">
          <span className="py-1 text-slate-400">Wk</span>
          {WEEKDAYS.map((d) => (
            <span key={d} className="py-1 font-medium text-slate-500 dark:text-slate-400">
              {d}
            </span>
          ))}
          {weeks.map((monday) => {
            const wkKey = toISODate(monday);
            const wkSelected = freq === "weekly" && wkKey === value;
            const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
            const weekCell = (
              <span className={`flex flex-col items-center justify-center py-1.5 ${freq === "weekly" ? "font-semibold" : "text-slate-400"}`}>
                {isoWeek(wkKey)}
                {freq === "weekly" && <Dot status={statusOf(wkKey)} />}
              </span>
            );
            if (freq === "weekly") {
              return (
                <button
                  key={wkKey}
                  type="button"
                  onClick={() => pick(wkKey)}
                  aria-pressed={wkSelected}
                  aria-label={`Week ${isoWeek(wkKey)}`}
                  className={`col-span-8 grid grid-cols-subgrid rounded-xl ${
                    wkSelected ? "bg-cyan-600 text-white" : wkKey === currentKey("weekly") ? "ring-1 ring-cyan-600" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {weekCell}
                  {days.map((d) => (
                    <span key={d.getDate()} className={`py-2 text-sm ${d.getMonth() !== cursor.getMonth() && !wkSelected ? "text-slate-300 dark:text-slate-600" : ""}`}>
                      {d.getDate()}
                    </span>
                  ))}
                </button>
              );
            }
            return (
              <div key={wkKey} className="col-span-8 grid grid-cols-subgrid">
                {weekCell}
                {days.map((d) => {
                  const key = toISODate(d);
                  const selected = key === value;
                  const outside = d.getMonth() !== cursor.getMonth();
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => pick(key)}
                      aria-pressed={selected}
                      aria-label={d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
                      className={`mx-auto flex h-10 w-10 flex-col items-center justify-center rounded-full text-sm ${
                        selected
                          ? "bg-cyan-600 font-semibold text-white"
                          : key === today
                            ? "font-semibold text-cyan-700 ring-1 ring-cyan-600 dark:text-cyan-300"
                            : outside
                              ? "text-slate-300 dark:text-slate-600"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {d.getDate()}
                      <Dot status={statusOf(key)} />
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </>
    );
  }

  return (
    <Sheet title={title} onClose={onClose}>
      {body}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> All done
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-500" /> Something missed
        </span>
      </div>
    </Sheet>
  );
}
