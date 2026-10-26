"use client";

import { useState } from "react";
import type { NewTask } from "@/lib/store";
import { CATEGORIES, CATEGORY_STYLE, FREQ_LABEL, type Category, type Freq, type Subtask, type Task } from "@/lib/types";
import { uid } from "@/lib/util";
import Sheet from "./Sheet";

interface Props {
  task?: Task; // undefined = new task
  defaultFreq: Freq;
  defaultCategory: Category;
  onSave: (t: NewTask) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const label = "mb-1.5 block text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400";
const input =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[15px] outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-950";

export default function TaskSheet({ task, defaultFreq, defaultCategory, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [freq, setFreq] = useState<Freq>(task?.freq ?? defaultFreq);
  const [category, setCategory] = useState<Category>(task?.category ?? defaultCategory);
  const [high, setHigh] = useState(task?.priority === "high");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks ?? []);
  const [newSub, setNewSub] = useState("");

  const addSub = () => {
    const v = newSub.trim();
    if (!v) return;
    setSubtasks((s) => [...s, { id: uid(), title: v, done: false }]);
    setNewSub("");
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    // Include a subtask that was typed but not yet added.
    const pending = newSub.trim() ? [{ id: uid(), title: newSub.trim(), done: false }] : [];
    onSave({
      title: title.trim(),
      freq,
      category,
      priority: high ? "high" : "normal",
      notes: notes.trim() || undefined,
      subtasks: [...subtasks.map((s) => ({ ...s, title: s.title.trim() })).filter((s) => s.title), ...pending],
    });
    onClose();
  };

  return (
    <Sheet title={task ? "Edit task" : "New task"} onClose={onClose}>
      <form onSubmit={save} className="space-y-5">
        <div>
          <label htmlFor="task-title" className={label}>
            Task
          </label>
          <input
            id="task-title"
            autoFocus={!task}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Order polymer for next week"
            className={input}
          />
        </div>

        <div>
          <span className={label}>Repeats</span>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {(Object.keys(FREQ_LABEL) as Freq[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFreq(f)}
                className={`rounded-md py-2 text-sm font-medium ${
                  freq === f ? "bg-white text-cyan-700 shadow-sm dark:bg-slate-950 dark:text-cyan-300" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {FREQ_LABEL[f]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className={label}>Category</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  category === c ? `${CATEGORY_STYLE[c].chip} ring-2 ring-current/40` : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 dark:border-slate-700">
          <span className="text-sm font-medium">⚑ High priority</span>
          <input type="checkbox" checked={high} onChange={(e) => setHigh(e.target.checked)} className="h-5 w-5 accent-rose-600" />
        </label>

        <div>
          <span className={label}>Subtasks</span>
          {subtasks.length > 0 && (
            <ul className="mb-2 space-y-1.5">
              {subtasks.map((s, i) => (
                <li key={s.id} className="flex items-center gap-2">
                  <input
                    value={s.title}
                    aria-label={`Subtask ${i + 1}`}
                    onChange={(e) => setSubtasks((all) => all.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x)))}
                    className={`${input} py-2 text-sm`}
                  />
                  <button
                    type="button"
                    aria-label="Remove subtask"
                    onClick={() => setSubtasks((all) => all.filter((x) => x.id !== s.id))}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <input
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSub();
                }
              }}
              placeholder="Add a subtask"
              aria-label="New subtask"
              className={`${input} py-2 text-sm`}
            />
            <button type="button" onClick={addSub} className="rounded-lg bg-slate-100 px-3 text-sm font-medium dark:bg-slate-800">
              Add
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="task-notes" className={label}>
            Notes
          </label>
          <textarea
            id="task-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Optional — supplier contact, PO no., etc."
            className={input}
          />
        </div>

        <div className="flex gap-2 pt-1">
          {onDelete && (
            <button
              type="button"
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="rounded-lg px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
            >
              Delete
            </button>
          )}
          <button
            type="submit"
            disabled={!title.trim()}
            className="flex-1 rounded-lg bg-cyan-600 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {task ? "Save changes" : "Add task"}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
