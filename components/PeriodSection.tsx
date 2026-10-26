"use client";

import { periodLabel } from "@/lib/period";
import { FREQ_LABEL, type Freq, type TaskEntry } from "@/lib/types";
import TaskList from "./TaskList";

type ListProps = Omit<React.ComponentProps<typeof TaskList>, "tasks" | "emptyText">;

interface Props extends ListProps {
  freq: Freq;
  periodKey: string;
  tasks: TaskEntry[];
}

/** Weekly or monthly tasks shown inside the Daily tab. Ticking one ticks it for the whole week or month. */
export default function PeriodSection({ freq, periodKey, tasks, ...listProps }: Props) {
  if (tasks.length === 0) return null;
  const done = tasks.filter((t) => t.done).length;
  return (
    <section className="space-y-2 pt-2">
      <h2 className="flex items-baseline gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold tracking-wide uppercase">{FREQ_LABEL[freq]}</span>
        <span className="truncate">{periodLabel(freq, periodKey)}</span>
        <span className="h-px flex-1 self-center bg-slate-200 dark:bg-slate-800" />
        <span className={`shrink-0 font-medium tabular-nums ${done === tasks.length ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
          {done} / {tasks.length} done
        </span>
      </h2>
      <TaskList tasks={tasks} emptyText="" {...listProps} />
    </section>
  );
}
