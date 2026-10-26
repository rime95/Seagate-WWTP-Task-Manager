"use client";

import type { Invoice } from "@/lib/types";
import { monthLabel, shortDate } from "@/lib/util";
import Checkbox from "./Checkbox";
import ProgressBar from "./ProgressBar";
import SwipeRow from "./SwipeRow";

interface Props {
  invoices: Invoice[];
  onToggle: (i: Invoice) => void;
  onEdit: (i: Invoice) => void;
  onDelete: (i: Invoice) => void;
}

/** Simple "sent to Finance?" checklist, grouped by month (newest first). */
export default function InvoiceList({ invoices, onToggle, onEdit, onDelete }: Props) {
  if (invoices.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
        No invoices yet.
        <br />
        Add one above, e.g. “Supplier A — Sep invoice”.
      </p>
    );
  }

  const months = [...new Set(invoices.map((i) => i.month))].sort().reverse();

  return (
    <div className="space-y-6">
      {months.map((m) => {
        const items = invoices.filter((i) => i.month === m).sort((a, b) => Number(a.sent) - Number(b.sent));
        const sent = items.filter((i) => i.sent).length;
        return (
          <section key={m}>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold">{monthLabel(m)}</h2>
            </div>
            <div className="mb-3">
              <ProgressBar done={sent} total={items.length} unit="sent" />
            </div>
            <ul className="space-y-2">
              {items.map((inv) => (
                <li key={inv.id}>
                  <SwipeRow onSwipeRight={() => onToggle(inv)} onSwipeLeft={() => onDelete(inv)} rightLabel={inv.sent ? "Undo" : "Sent"}>
                    <div
                      className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 dark:bg-slate-900 ${
                        inv.sent ? "border-transparent opacity-60" : "border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <Checkbox tone="amber" checked={inv.sent} onChange={() => onToggle(inv)} label={`"${inv.name}" sent to Finance`} />
                      <button type="button" onClick={() => onEdit(inv)} className="min-w-0 flex-1 text-left">
                        <span className={`block text-[15px] ${inv.sent ? "text-slate-500 line-through" : ""}`}>{inv.name}</span>
                        <span className={`text-xs ${inv.sent ? "text-emerald-600 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
                          {inv.sent ? `✓ Sent to Finance ${shortDate(inv.sentAt)}` : "Not sent to Finance yet"}
                        </span>
                      </button>
                    </div>
                  </SwipeRow>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
