"use client";

import { CATEGORIES, CATEGORY_STYLE, type Category } from "@/lib/types";

interface Props {
  value: Category | "All";
  counts: Partial<Record<Category, number>>;
  onChange: (c: Category | "All") => void;
}

export default function CategoryFilter({ value, counts, onChange }: Props) {
  const used = CATEGORIES.filter((c) => counts[c]);
  if (used.length < 2) return null;
  const base = "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition border";
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
      <button
        type="button"
        onClick={() => onChange("All")}
        className={`${base} ${
          value === "All"
            ? "border-slate-800 bg-slate-800 text-white dark:border-slate-200 dark:bg-slate-200 dark:text-slate-900"
            : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"
        }`}
      >
        All
      </button>
      {used.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(value === c ? "All" : c)}
          className={`${base} ${
            value === c ? `${CATEGORY_STYLE[c].chip} border-transparent ring-2 ring-current/30` : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
