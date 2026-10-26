"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import CategoryFilter from "@/components/CategoryFilter";
import ConfirmSheet, { type ConfirmState } from "@/components/ConfirmSheet";
import DateNav from "@/components/DateNav";
import Header from "@/components/Header";
import InvoiceList from "@/components/InvoiceList";
import InvoiceSheet from "@/components/InvoiceSheet";
import PeriodPicker from "@/components/PeriodPicker";
import ProgressBar from "@/components/ProgressBar";
import PeriodSection from "@/components/PeriodSection";
import QuickAdd from "@/components/QuickAdd";
import Tabs from "@/components/Tabs";
import TaskList from "@/components/TaskList";
import TaskSheet, { type TaskForm } from "@/components/TaskSheet";
import Toast, { type ToastState } from "@/components/Toast";
import TodayStrip from "@/components/TodayStrip";
import { exportData, parseBackup } from "@/lib/backup";
import { currentEntries, entriesFor, periodStatus, type PeriodStatus } from "@/lib/entries";
import { currentKey, onlyLabel, parseISODate, periodKey, periodRange, periodWhen } from "@/lib/period";
import { useAppData } from "@/lib/store";
import type { Category, Freq, Invoice, Tab, Task, TaskEntry } from "@/lib/types";

const TAB_KEY = "wwtp-tm-tab";
const FREQS: Freq[] = ["daily", "weekly", "monthly"];

type SheetState = { kind: "task"; task?: Task } | { kind: "invoice"; invoice?: Invoice } | { kind: "picker" } | null;
type Cursors = Record<Tab, string>;

function currentCursors(): Cursors {
  return { daily: currentKey("daily"), weekly: currentKey("weekly"), monthly: currentKey("monthly"), invoices: currentKey("monthly") };
}

export default function Home() {
  const { data, ready, saveError, actions } = useAppData();
  const [tab, setTab] = useState<Tab>("daily");
  const [cursors, setCursors] = useState<Cursors | null>(null);
  const [filter, setFilter] = useState<Category | "All">("All");
  const [sheet, setSheet] = useState<SheetState>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  // Dates depend on the device clock, so they are set after mount (not at build time).
  useEffect(() => {
    setCursors(currentCursors());
    try {
      const saved = localStorage.getItem(TAB_KEY) as Tab | null;
      if (saved && ["daily", "weekly", "monthly", "invoices"].includes(saved)) setTab(saved);
    } catch {}

    // If the app stays open past midnight, move views that were on "today" to the new today.
    let last = currentCursors();
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const now = currentCursors();
      setCursors((c) => c && (Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v === last[k as Tab] ? now[k as Tab] : v])) as Cursors));
      last = now;
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // A sheet covers the bottom of the screen, so drop any pending toast when one opens.
  useEffect(() => {
    if (sheet || confirm) setToast(null);
  }, [sheet, confirm]);

  const changeTab = (t: Tab) => {
    setTab(t);
    setFilter("All");
    try {
      localStorage.setItem(TAB_KEY, t);
    } catch {}
  };

  const notify = useCallback((message: string, onUndo?: () => void) => setToast({ id: Date.now(), message, onUndo }), []);
  const dismissToast = useCallback(() => setToast(null), []);

  const nowEntries = useMemo(
    () => Object.fromEntries(FREQS.map((f) => [f, currentEntries(data, f)])) as Record<Freq, TaskEntry[]>,
    [data],
  );
  const thisMonth = currentKey("monthly");
  const unsentInvoices = data.invoices.filter((i) => !i.sent && i.month <= thisMonth);
  const counts: Record<Tab, number> = {
    daily: nowEntries.daily.filter((e) => !e.done).length,
    weekly: nowEntries.weekly.filter((e) => !e.done).length,
    monthly: nowEntries.monthly.filter((e) => !e.done).length,
    invoices: unsentInvoices.length,
  };

  if (!ready || !cursors) {
    return <main className="mx-auto min-h-dvh max-w-xl px-4" />;
  }

  const isTaskTab = tab !== "invoices";
  const navFreq: Freq = isTaskTab ? tab : "monthly";
  const key = cursors[tab];
  const setKey = (k: string) => setCursors({ ...cursors, [tab]: k });
  const viewingNow = periodWhen(navFreq, key) === 0;

  // The period (in any tab's frequency) that contains the first day of what is on screen.
  const viewedDay = parseISODate(periodRange(navFreq, key).start);
  const keyFor = (f: Freq) => periodKey(f, viewedDay);

  const entries = isTaskTab ? entriesFor(data, tab, key) : [];
  // The Daily tab also lists this day's weekly and monthly tasks; their ticks cover the whole week or month.
  const extraFreqs: Freq[] = tab === "daily" ? ["weekly", "monthly"] : [];
  const extras = extraFreqs.map((f) => ({ freq: f, key: keyFor(f), entries: entriesFor(data, f, keyFor(f)) }));
  const byFilter = (list: TaskEntry[]) => (filter === "All" ? list : list.filter((t) => t.category === filter));
  const visible = byFilter(entries);
  const categoryCounts = [...entries, ...extras.flatMap((x) => x.entries)].reduce<Partial<Record<Category, number>>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + 1;
    return acc;
  }, {});
  const extrasVisible = extras.some((x) => byFilter(x.entries).length > 0);

  const monthInvoices = data.invoices.filter((i) => i.month === key);
  const earlierUnsent = data.invoices.filter((i) => !i.sent && i.month < key);

  const statusOf = (k: string): PeriodStatus => {
    if (isTaskTab) return periodStatus(data, tab, k);
    const list = data.invoices.filter((i) => i.month === k);
    if (!list.length) return "none";
    if (list.every((i) => i.sent)) return "done";
    return periodWhen("monthly", k) < 0 ? "missed" : "open";
  };

  // --- Actions with Undo ---
  const toggleTask = (e: TaskEntry) => {
    actions.toggleTask(e.id, e.periodKey);
    if (!e.done) notify(`Done: ${e.title}`, () => actions.toggleTask(e.id, e.periodKey));
  };
  const deleteTask = (id: string) => {
    const index = data.tasks.findIndex((x) => x.id === id);
    const original = data.tasks[index];
    if (!original) return;
    const keepsHistory = !original.once && Object.keys(data.checks[id] ?? {}).length > 0;
    actions.removeTask(id);
    notify(keepsHistory ? "Removed from today on (past days kept)" : "Task deleted", () => actions.putTask(original, index));
  };
  const toggleInvoice = (i: Invoice) => {
    actions.toggleInvoice(i.id);
    if (!i.sent) notify("Marked as sent to Finance", () => actions.putInvoice(i));
  };
  const deleteInvoice = (i: Invoice) => {
    const index = data.invoices.findIndex((x) => x.id === i.id);
    actions.deleteInvoice(i.id);
    notify("Invoice deleted", () => actions.putInvoice(i, index));
  };

  const saveTask = (form: TaskForm, existing?: Task) => {
    const { oneOff, ...fields } = form;
    if (existing) {
      const once = oneOff ? (existing.once && existing.freq === form.freq ? existing.once : keyFor(form.freq)) : undefined;
      actions.updateTask(existing.id, { ...fields, once });
    } else {
      const k = keyFor(form.freq);
      actions.addTask({ ...fields, start: periodRange(form.freq, k).start, once: oneOff ? k : undefined });
    }
  };

  const importFile = async (file: File) => {
    let next;
    try {
      next = parseBackup(JSON.parse(await file.text()));
    } catch (e) {
      notify(e instanceof Error && !(e instanceof SyntaxError) ? e.message : "Couldn’t read this file. Choose a .json backup exported from this app.");
      return;
    }
    const before = data;
    setConfirm({
      title: "Import backup?",
      message: `This replaces everything on this device with the backup (${next.tasks.length} tasks, ${next.invoices.length} invoices).`,
      confirmLabel: "Replace data",
      onConfirm: () => {
        actions.replaceAll(next);
        notify("Backup imported", () => actions.replaceAll(before));
      },
    });
  };

  // On the Daily tab, weekly and monthly tasks are already listed below, so the strip shows daily ones only.
  const focus = (tab === "daily" ? ["daily" as Freq] : FREQS).flatMap((f) => nowEntries[f].filter((e) => e.priority === "high" && !e.done));
  const listHandlers = {
    onToggle: toggleTask,
    onToggleSubtask: (t: TaskEntry, sid: string) => actions.toggleSubtask(t.id, t.periodKey, sid),
    onEdit: (t: TaskEntry) => setSheet({ kind: "task", task: data.tasks.find((x) => x.id === t.id) }),
    onDelete: (t: TaskEntry) => deleteTask(t.id),
  };
  const emptyText =
    filter !== "All"
      ? `No ${filter} tasks here.`
      : periodWhen(navFreq, key) < 0
        ? "No tasks were scheduled for this period."
        : `No ${tab} tasks yet. Add one above.`;

  return (
    <main className="mx-auto min-h-dvh max-w-xl px-4 pb-32">
      <Header onExport={() => exportData(data)} onImport={importFile} />

      <Tabs active={tab} counts={counts} onChange={changeTab} />

      {saveError && (
        <p className="mt-2 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-200">
          Couldn’t save to this device’s storage. Export a backup to keep your data safe.
        </p>
      )}

      <div className="mt-2 space-y-4">
        <DateNav freq={navFreq} value={key} onChange={setKey} onOpenPicker={() => setSheet({ kind: "picker" })} />

        {isTaskTab && viewingNow && (
          <TodayStrip
            tasks={focus}
            unsentInvoices={unsentInvoices.length}
            onToggle={toggleTask}
            onOpenInvoices={() => changeTab("invoices")}
          />
        )}

        {isTaskTab ? (
          <>
            <QuickAdd
              key={`${tab}-${key}`}
              placeholder={viewingNow ? `Add a ${tab} task…` : `Add a ${tab} task (starts ${onlyLabel(tab, key)})…`}
              onAdd={(title) =>
                actions.addTask({
                  title,
                  freq: tab,
                  category: filter === "All" ? "Other" : filter,
                  priority: "normal",
                  subtasks: [],
                  start: periodRange(tab, key).start,
                })
              }
            />
            {entries.length > 0 && <ProgressBar done={entries.filter((t) => t.done).length} total={entries.length} />}
            <CategoryFilter value={filter} counts={categoryCounts} onChange={setFilter} />
            {(visible.length > 0 || !extrasVisible) && <TaskList tasks={visible} emptyText={emptyText} {...listHandlers} />}
            {extras.map((x) => (
              <PeriodSection key={x.freq} freq={x.freq} periodKey={x.key} tasks={byFilter(x.entries)} {...listHandlers} />
            ))}
          </>
        ) : (
          <>
            {earlierUnsent.length > 0 && (
              <button
                type="button"
                onClick={() => setKey(earlierUnsent.map((i) => i.month).sort().at(-1)!)}
                className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-left text-sm font-medium text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200"
              >
                ⚠ {earlierUnsent.length} invoice{earlierUnsent.length > 1 ? "s" : ""} from earlier months not sent yet →
              </button>
            )}
            <QuickAdd key={key} placeholder={`Add an invoice for ${onlyLabel("monthly", key)}…`} onAdd={(name) => actions.addInvoice(name, key)} />
            <InvoiceList
              invoices={monthInvoices}
              onToggle={toggleInvoice}
              onEdit={(i) => setSheet({ kind: "invoice", invoice: i })}
              onDelete={deleteInvoice}
            />
          </>
        )}
      </div>

      <button
        type="button"
        aria-label={isTaskTab ? "New task" : "New invoice"}
        onClick={() => setSheet(isTaskTab ? { kind: "task" } : { kind: "invoice" })}
        className="fixed right-5 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 transition hover:bg-cyan-700 active:scale-95 sm:right-[max(1.25rem,calc(50%-18rem))]"
      >
        <svg viewBox="0 0 20 20" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M10 4v12M4 10h12" strokeLinecap="round" />
        </svg>
      </button>

      {sheet?.kind === "picker" && (
        <PeriodPicker freq={navFreq} value={key} statusOf={statusOf} onPick={setKey} onClose={() => setSheet(null)} />
      )}
      {sheet?.kind === "task" && (
        <TaskSheet
          task={sheet.task}
          defaultFreq={isTaskTab ? tab : "daily"}
          defaultCategory={filter === "All" ? "Other" : filter}
          oneOffLabel={(f) => onlyLabel(f, sheet.task?.once && sheet.task.freq === f ? sheet.task.once : keyFor(f))}
          onSave={(form) => saveTask(form, sheet.task)}
          onDelete={sheet.task ? () => deleteTask(sheet.task!.id) : undefined}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.kind === "invoice" && (
        <InvoiceSheet
          invoice={sheet.invoice}
          defaultMonth={key}
          onSave={(name, month) => {
            const existing = sheet.invoice;
            if (existing) actions.updateInvoice(existing.id, { name, month });
            else actions.addInvoice(name, month);
          }}
          onDelete={sheet.invoice ? () => deleteInvoice(sheet.invoice!) : undefined}
          onClose={() => setSheet(null)}
        />
      )}
      {confirm && <ConfirmSheet state={confirm} onClose={() => setConfirm(null)} />}

      <Toast toast={toast} onDismiss={dismissToast} />
    </main>
  );
}
