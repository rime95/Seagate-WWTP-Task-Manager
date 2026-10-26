"use client";

import { useState } from "react";
import type { Invoice } from "@/lib/types";
import { currentMonth } from "@/lib/util";
import Sheet from "./Sheet";

interface Props {
  invoice?: Invoice;
  onSave: (name: string, month: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const label = "mb-1.5 block text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400";
const input =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[15px] outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-950";

export default function InvoiceSheet({ invoice, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState(invoice?.name ?? "");
  const [month, setMonth] = useState(invoice?.month ?? currentMonth());

  return (
    <Sheet title={invoice ? "Edit invoice" : "New invoice"} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !month) return;
          onSave(name.trim(), month);
          onClose();
        }}
        className="space-y-5"
      >
        <div>
          <label htmlFor="inv-name" className={label}>
            Invoice
          </label>
          <input
            id="inv-name"
            autoFocus={!invoice}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Supplier A — Sep invoice"
            className={input}
          />
        </div>
        <div>
          <label htmlFor="inv-month" className={label}>
            Month
          </label>
          <input id="inv-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={input} />
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
          <button type="submit" disabled={!name.trim()} className="flex-1 rounded-lg bg-cyan-600 py-3 text-sm font-semibold text-white disabled:opacity-40">
            {invoice ? "Save changes" : "Add invoice"}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
