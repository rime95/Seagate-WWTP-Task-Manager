"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { parseBackup } from "./backup";
import { seedData } from "./seed";
import type { AppData, Freq, Invoice, Task } from "./types";
import { uid } from "./util";

const STORAGE_KEY = "wwtp-tm-v1";
const EMPTY: AppData = { version: 1, tasks: [], invoices: [] };

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedData();
    return parseBackup(JSON.parse(raw));
  } catch {
    return seedData();
  }
}

export type NewTask = Omit<Task, "id" | "done" | "doneAt">;

export function useAppData() {
  const [data, setData] = useState<AppData>(EMPTY);
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // Read localStorage only on the client, after hydration.
  useEffect(() => {
    setData(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, [data, ready]);

  const mapTask = useCallback((id: string, fn: (t: Task) => Task) => {
    setData((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? fn(t) : t)) }));
  }, []);

  const mapInvoice = useCallback((id: string, fn: (i: Invoice) => Invoice) => {
    setData((d) => ({ ...d, invoices: d.invoices.map((i) => (i.id === id ? fn(i) : i)) }));
  }, []);

  const actions = useMemo(
    () => ({
      replaceAll: (next: AppData) => setData(next),

      addTask: (t: NewTask) => setData((d) => ({ ...d, tasks: [...d.tasks, { ...t, id: uid(), done: false }] })),
      updateTask: (id: string, patch: Partial<Task>) => mapTask(id, (t) => ({ ...t, ...patch })),
      /** Replace a task by id, or re-insert it at `index` if it was deleted (used by Undo). */
      putTask: (task: Task, index?: number) =>
        setData((d) => {
          if (d.tasks.some((t) => t.id === task.id)) return { ...d, tasks: d.tasks.map((t) => (t.id === task.id ? task : t)) };
          const tasks = [...d.tasks];
          tasks.splice(index ?? tasks.length, 0, task);
          return { ...d, tasks };
        }),
      deleteTask: (id: string) => setData((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) })),
      toggleTask: (id: string) =>
        mapTask(id, (t) => ({ ...t, done: !t.done, doneAt: !t.done ? new Date().toISOString() : undefined })),
      toggleSubtask: (taskId: string, subId: string) =>
        mapTask(taskId, (t) => ({
          ...t,
          subtasks: t.subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s)),
        })),
      resetFreq: (freq: Freq) =>
        setData((d) => ({
          ...d,
          tasks: d.tasks.map((t) =>
            t.freq === freq
              ? { ...t, done: false, doneAt: undefined, subtasks: t.subtasks.map((s) => ({ ...s, done: false })) }
              : t,
          ),
        })),

      addInvoice: (name: string, month: string) =>
        setData((d) => ({ ...d, invoices: [...d.invoices, { id: uid(), name, month, sent: false }] })),
      updateInvoice: (id: string, patch: Partial<Invoice>) => mapInvoice(id, (i) => ({ ...i, ...patch })),
      putInvoice: (inv: Invoice, index?: number) =>
        setData((d) => {
          if (d.invoices.some((i) => i.id === inv.id)) return { ...d, invoices: d.invoices.map((i) => (i.id === inv.id ? inv : i)) };
          const invoices = [...d.invoices];
          invoices.splice(index ?? invoices.length, 0, inv);
          return { ...d, invoices };
        }),
      deleteInvoice: (id: string) => setData((d) => ({ ...d, invoices: d.invoices.filter((i) => i.id !== id) })),
      toggleInvoice: (id: string) =>
        mapInvoice(id, (i) => ({ ...i, sent: !i.sent, sentAt: !i.sent ? new Date().toISOString() : undefined })),
    }),
    [mapTask, mapInvoice],
  );

  return { data, ready, saveError, actions };
}

export type Actions = ReturnType<typeof useAppData>["actions"];
