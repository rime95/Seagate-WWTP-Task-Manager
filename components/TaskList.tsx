"use client";

import { useState } from "react";
import type { TaskEntry as Task } from "@/lib/types";
import TaskItem from "./TaskItem";

interface Props {
  tasks: Task[]; // already filtered to one tab + category
  emptyText: string;
  onToggle: (t: Task) => void;
  onToggleSubtask: (t: Task, subId: string) => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
}

export default function TaskList({ tasks, emptyText, onToggle, onToggleSubtask, onEdit, onDelete }: Props) {
  const [showDone, setShowDone] = useState(true);
  // High priority first; otherwise keep the order the user added them in.
  const open = tasks.filter((t) => !t.done).sort((a, b) => (a.priority === b.priority ? 0 : a.priority === "high" ? -1 : 1));
  const done = tasks.filter((t) => t.done).sort((a, b) => (b.doneAt ?? "").localeCompare(a.doneAt ?? ""));

  const render = (t: Task) => (
    <TaskItem
      key={t.id}
      task={t}
      onToggle={() => onToggle(t)}
      onToggleSubtask={(sid) => onToggleSubtask(t, sid)}
      onEdit={() => onEdit(t)}
      onDelete={() => onDelete(t)}
    />
  );

  if (tasks.length === 0) {
    return <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">{emptyText}</p>;
  }

  return (
    <div className="space-y-4">
      {open.length > 0 ? (
        <ul className="space-y-2">{open.map(render)}</ul>
      ) : (
        <p className="py-6 text-center text-sm text-emerald-600 dark:text-emerald-400">Everything here is done. Nice work! ✅</p>
      )}

      {done.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowDone((s) => !s)}
            aria-expanded={showDone}
            className="mb-2 flex w-full items-center gap-2 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400"
          >
            <svg viewBox="0 0 20 20" className={`h-3.5 w-3.5 transition-transform ${showDone ? "rotate-90" : ""}`} fill="currentColor">
              <path d="M7 5l6 5-6 5V5z" />
            </svg>
            Done ({done.length})
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </button>
          {showDone && <ul className="space-y-2">{done.map(render)}</ul>}
        </div>
      )}
    </div>
  );
}
