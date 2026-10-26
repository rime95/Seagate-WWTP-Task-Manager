"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import CategoryFilter from "@/components/CategoryFilter";
import Header from "@/components/Header";
import InvoiceList from "@/components/InvoiceList";
import InvoiceSheet from "@/components/InvoiceSheet";
import ProgressBar from "@/components/ProgressBar";
import QuickAdd from "@/components/QuickAdd";
import Tabs from "@/components/Tabs";
import TaskList from "@/components/TaskList";
import TaskSheet from "@/components/TaskSheet";
import Toast, { type ToastState } from "@/components/Toast";
import TodayStrip from "@/components/TodayStrip";
import { exportData, parseBackup } from "@/lib/backup";
import { useAppData } from "@/lib/store";
import { FREQ_LABEL, type Category, type Freq, type Invoice, type Tab, type Task } from "@/lib/types";
import { currentMonth } from "@/lib/util";

const TAB_KEY = "wwtp-tm-tab";

type SheetState = { kind: "task"; task?: Task } | { kind: "invoice"; invoice?: Invoice } | null;

export default function Home() {
  const { data, ready, saveError, actions } = useAppData();
  const [tab, setTab] = useState<Tab>("daily");
  const [filter, setFilter] = useState<Category | "All">("All");
  const [sheet, setSheet] = useState<SheetState>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(TAB_KEY) as Tab | null;
      if (saved && ["daily", "weekly", "monthly", "invoices"].includes(saved)) setTab(saved);
    } catch {}
  }, []);

  const changeTab = (t: Tab) => {
    setTab(t);
    setFilter("All");
    try {
      localStorage.setItem(TAB_KEY, t);
    } catch {}
  };

  const notify = useCallback((message: string, onUndo?: () => void) => setToast({ id: Date.now(), message, onUndo }), []);
  const dismissToast = useCallback(() => setToast(null), []);

  const counts = useMemo(() => {
    const open = (f: Freq) => data.tasks.filter((t) => t.freq === f && !t.done).length;
    return {
      daily: open("daily"),
      weekly: open("weekly"),
      monthly: open("monthly"),
      invoices: data.invoices.filter((i) => !i.sent).length,
    };
  }, [data]);

  const focusTasks = data.tasks.filter((t) => t.priority === "high" && !t.done);
  const isTaskTab = tab !== "invoices";
  const tabTasks = isTaskTab ? data.tasks.filter((t) => t.freq === tab) : [];
  const visibleTasks = filter === "All" ? tabTasks : tabTasks.filter((t) => t.category === filter);
  const categoryCounts = tabTasks.reduce<Partial<Record<Category, number>>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + 1;
    return acc;
  }, {});

  // --- Task actions with Undo ---
  const toggleTask = (t: Task) => {
    actions.toggleTask(t.id);
    if (!t.done) notify(`Done: ${t.title}`, () => actions.putTask(t));
  };
  const deleteTask = (t: Task) => {
    const index = data.tasks.findIndex((x) => x.id === t.id);
    actions.deleteTask(t.id);
    notify("Task deleted", () => actions.putTask(t, index));
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

  const resetTab = () => {
    if (!isTaskTab) return;
    const before = data.tasks.filter((t) => t.freq === tab);
    if (!window.confirm(`Uncheck all ${FREQ_LABEL[tab].toLowerCase()} tasks to start a new ${tab === "daily" ? "day" : tab.replace("ly", "")}?`)) return;
    actions.resetFreq(tab);
    notify(`${FREQ_LABEL[tab]} tasks reset`, () => before.forEach((t) => actions.putTask(t)));
  };

  const importFile = async (file: File) => {
    try {
      const next = parseBackup(JSON.parse(await file.text()));
      if (!window.confirm(`Replace current data with this backup? (${next.tasks.length} tasks, ${next.invoices.length} invoices)`)) return;
      const before = data;
      actions.replaceAll(next);
      notify("Backup imported", () => actions.replaceAll(before));
    } catch (e) {
      window.alert(e instanceof Error && !(e instanceof SyntaxError) ? e.message : "Could not read this file.");
    }
  };

  if (!ready) {
    return <main className="mx-auto min-h-dvh max-w-xl px-4" />;
  }

  return (
    <main className="mx-auto min-h-dvh max-w-xl px-4 pb-32">
      <Header
        onExport={() => exportData(data)}
        onImport={importFile}
        onReset={isTaskTab ? resetTab : undefined}
        resetLabel={isTaskTab ? `Reset ${FREQ_LABEL[tab].toLowerCase()} tasks` : undefined}
      />

      <Tabs active={tab} counts={counts} onChange={changeTab} />

      {saveError && (
        <p className="mt-2 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-200">
          Couldn’t save to this device’s storage. Export a backup to keep your data safe.
        </p>
      )}

      <div className="mt-3 space-y-4">
        <TodayStrip
          tasks={focusTasks}
          unsentInvoices={tab === "invoices" ? 0 : counts.invoices}
          onToggle={(id) => {
            const t = data.tasks.find((x) => x.id === id);
            if (t) toggleTask(t);
          }}
          onOpenInvoices={() => changeTab("invoices")}
        />

        {isTaskTab ? (
          <>
            <QuickAdd
              placeholder={`Add a ${tab} task…`}
              onAdd={(title) =>
                actions.addTask({ title, freq: tab, category: filter === "All" ? "Other" : filter, priority: "normal", subtasks: [] })
              }
            />
            {tabTasks.length > 0 && <ProgressBar done={tabTasks.filter((t) => t.done).length} total={tabTasks.length} />}
            <CategoryFilter value={filter} counts={categoryCounts} onChange={setFilter} />
            <TaskList
              tasks={visibleTasks}
              emptyText={filter === "All" ? `No ${tab} tasks yet. Add one above.` : `No ${filter} tasks here.`}
              onToggle={toggleTask}
              onToggleSubtask={(t, sid) => actions.toggleSubtask(t.id, sid)}
              onEdit={(t) => setSheet({ kind: "task", task: t })}
              onDelete={deleteTask}
            />
          </>
        ) : (
          <>
            <QuickAdd placeholder="Add an invoice (this month)…" onAdd={(name) => actions.addInvoice(name, currentMonth())} />
            <InvoiceList
              invoices={data.invoices}
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

      {sheet?.kind === "task" && (
        <TaskSheet
          task={sheet.task}
          defaultFreq={isTaskTab ? tab : "daily"}
          defaultCategory={filter === "All" ? "Other" : filter}
          onSave={(t) => {
            const existing = sheet.task;
            if (existing) actions.updateTask(existing.id, t);
            else actions.addTask(t);
          }}
          onDelete={sheet.task ? () => deleteTask(sheet.task!) : undefined}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.kind === "invoice" && (
        <InvoiceSheet
          invoice={sheet.invoice}
          onSave={(name, month) => {
            const existing = sheet.invoice;
            if (existing) actions.updateInvoice(existing.id, { name, month });
            else actions.addInvoice(name, month);
          }}
          onDelete={sheet.invoice ? () => deleteInvoice(sheet.invoice!) : undefined}
          onClose={() => setSheet(null)}
        />
      )}

      <Toast toast={toast} onDismiss={dismissToast} />
    </main>
  );
}
