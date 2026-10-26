"use client";

import { useState } from "react";
import { CATEGORY_STYLE, type Task } from "@/lib/types";
import { shortTime } from "@/lib/util";
import Checkbox from "./Checkbox";
import SwipeRow from "./SwipeRow";

interface Props {
  task: Task;
  onToggle: () => void;
  onToggleSubtask: (subId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TaskItem({ task, onToggle, onToggleSubtask, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const style = CATEGORY_STYLE[task.category];
  const subDone = task.subtasks.filter((s) => s.done).length;
  const hasSubs = task.subtasks.length > 0;

  return (
    <li>
      <SwipeRow onSwipeRight={onToggle} onSwipeLeft={onDelete} rightLabel={task.done ? "Undo" : "Done"}>
        <div
          className={`group relative flex gap-3 border bg-white py-3 pr-2 pl-4 rounded-xl dark:bg-slate-900 ${
            task.done ? "border-transparent opacity-60" : "border-slate-200 dark:border-slate-800"
          }`}
        >
          <span className={`absolute top-3 bottom-3 left-0 w-1 rounded-r ${style.bar}`} aria-hidden />
          <div className="pt-0.5">
            <Checkbox checked={task.done} onChange={onToggle} label={`Mark "${task.title}" ${task.done ? "not done" : "done"}`} />
          </div>

          <div className="min-w-0 flex-1">
            <button type="button" onClick={onEdit} className="block w-full text-left">
              <span className={`block text-[15px] leading-snug ${task.done ? "text-slate-500 line-through" : ""}`}>
                {task.title}
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                <span className={`rounded-full px-2 py-0.5 font-medium ${style.chip}`}>{task.category}</span>
                {task.priority === "high" && !task.done && <span className="font-medium text-rose-600 dark:text-rose-400">⚑ High</span>}
                {task.done && task.doneAt && <span className="text-emerald-600 dark:text-emerald-400">✓ {shortTime(task.doneAt)}</span>}
                {task.notes && <span className="text-slate-400" title={task.notes}>📝</span>}
              </span>
            </button>

            {hasSubs && (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                aria-expanded={expanded}
                className="mt-1.5 flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                <svg viewBox="0 0 20 20" className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`} fill="currentColor">
                  <path d="M7 5l6 5-6 5V5z" />
                </svg>
                {subDone} / {task.subtasks.length} subtasks
              </button>
            )}

            {hasSubs && expanded && (
              <ul className="mt-2 space-y-2 border-l-2 border-slate-100 pl-3 dark:border-slate-800">
                {task.subtasks.map((s) => (
                  <li key={s.id} className="flex items-center gap-2.5">
                    <Checkbox size="sm" checked={s.done} onChange={() => onToggleSubtask(s.id)} label={`Subtask "${s.title}"`} />
                    <span className={`text-sm ${s.done ? "text-slate-400 line-through" : ""}`}>{s.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete "${task.title}"`}
            className="hidden self-start rounded-lg p-1.5 text-slate-400 group-hover:block hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h12M8 6V4h4v2m-6 0l1 10h6l1-10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </SwipeRow>
    </li>
  );
}
