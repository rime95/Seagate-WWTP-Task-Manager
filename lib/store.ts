"use client";

import { useEffect, useMemo, useState } from "react";
import { parseBackup } from "./backup";
import { todayISO } from "./period";
import { seedData } from "./seed";
import type { AppData, Check, Invoice, Task } from "./types";
import { uid } from "./util";

const STORAGE_KEY = "wwtp-tm-v2";
const LEGACY_KEY = "wwtp-tm-v1";
const EMPTY: AppData = { version: 2, tasks: [], checks: {}, invoices: [] };

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return seedData();
    return parseBackup(JSON.parse(raw)); // also migrates version 1 data
  } catch {
    return seedData();
  }
}

export type NewTask = Omit<Task, "id">;

function setCheck(d: AppData, taskId: string, key: string, fn: (c: Check) => Check): AppData {
  const byKey = d.checks[taskId] ?? {};
  const next = fn(byKey[key] ?? {});
  const empty = !next.at && !next.subs?.length;
  const updated = { ...byKey };
  if (empty) delete updated[key];
  else updated[key] = next;
  return { ...d, checks: { ...d.checks, [taskId]: updated } };
}

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
      localStorage.removeItem(LEGACY_KEY);
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, [data, ready]);

  const actions = useMemo(
    () => ({
      replaceAll: (next: AppData) => setData(next),

      addTask: (t: NewTask) => setData((d) => ({ ...d, tasks: [...d.tasks, { ...t, id: uid() }] })),
      updateTask: (id: string, patch: Partial<Task>) =>
        setData((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      /** Replace a task by id, or re-insert it at `index` if it was deleted (used by Undo). */
      putTask: (task: Task, index?: number) =>
        setData((d) => {
          if (d.tasks.some((t) => t.id === task.id)) return { ...d, tasks: d.tasks.map((t) => (t.id === task.id ? task : t)) };
          const tasks = [...d.tasks];
          tasks.splice(index ?? tasks.length, 0, task);
          return { ...d, tasks };
        }),
      /**
       * One-off tasks and tasks never ticked are deleted outright. A repeating task with
       * history is ended today instead, so past days still show what was done.
       */
      removeTask: (id: string) =>
        setData((d) => {
          const task = d.tasks.find((t) => t.id === id);
          if (!task) return d;
          const hasHistory = Object.keys(d.checks[id] ?? {}).length > 0;
          if (!task.once && hasHistory) {
            return { ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, end: todayISO() } : t)) };
          }
          // Ticks are left in place so Undo brings them back with the task.
          return { ...d, tasks: d.tasks.filter((t) => t.id !== id) };
        }),

      toggleTask: (taskId: string, key: string) =>
        setData((d) => setCheck(d, taskId, key, (c) => ({ ...c, at: c.at ? undefined : new Date().toISOString() }))),
      toggleSubtask: (taskId: string, key: string, subId: string) =>
        setData((d) =>
          setCheck(d, taskId, key, (c) => {
            const subs = c.subs ?? [];
            return { ...c, subs: subs.includes(subId) ? subs.filter((s) => s !== subId) : [...subs, subId] };
          }),
        ),

      addInvoice: (name: string, month: string) =>
        setData((d) => ({ ...d, invoices: [...d.invoices, { id: uid(), name, month, sent: false }] })),
      updateInvoice: (id: string, patch: Partial<Invoice>) =>
        setData((d) => ({ ...d, invoices: d.invoices.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
      putInvoice: (inv: Invoice, index?: number) =>
        setData((d) => {
          if (d.invoices.some((i) => i.id === inv.id)) return { ...d, invoices: d.invoices.map((i) => (i.id === inv.id ? inv : i)) };
          const invoices = [...d.invoices];
          invoices.splice(index ?? invoices.length, 0, inv);
          return { ...d, invoices };
        }),
      deleteInvoice: (id: string) => setData((d) => ({ ...d, invoices: d.invoices.filter((i) => i.id !== id) })),
      toggleInvoice: (id: string) =>
        setData((d) => ({
          ...d,
          invoices: d.invoices.map((i) => (i.id === id ? { ...i, sent: !i.sent, sentAt: !i.sent ? new Date().toISOString() : undefined } : i)),
        })),
    }),
    [],
  );

  return { data, ready, saveError, actions };
}

export type Actions = ReturnType<typeof useAppData>["actions"];
