"use client";

import { useState } from "react";

export default function QuickAdd({ placeholder, onAdd }: { placeholder: string; onAdd: (title: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const v = value.trim();
        if (!v) return;
        onAdd(v);
        setValue("");
      }}
      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 dark:border-slate-800 dark:bg-slate-900"
    >
      <span className="text-xl leading-none text-cyan-600" aria-hidden>
        +
      </span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        enterKeyHint="done"
        className="min-h-12 flex-1 bg-transparent text-[15px] outline-none placeholder:text-slate-400"
      />
      {value.trim() && (
        <button type="submit" className="rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white">
          Add
        </button>
      )}
    </form>
  );
}
