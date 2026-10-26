"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  onExport: () => void;
  onImport: (file: File) => void;
}

export default function Header({ onExport, onImport }: Props) {
  const [open, setOpen] = useState(false);
  const [today, setToday] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setToday(new Date().toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }));
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  const item = "block w-full px-4 py-3 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800";

  return (
    <header className="flex items-center justify-between pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/icon.svg`} alt="" className="h-8 w-8" />
        <div>
          <h1 className="text-lg leading-tight font-bold">WWTP Tasks</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{today}</p>
        </div>
      </div>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="rounded-full p-2 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <svg viewBox="0 0 20 20" className="h-6 w-6" fill="currentColor">
            <circle cx="10" cy="4" r="1.7" />
            <circle cx="10" cy="10" r="1.7" />
            <circle cx="10" cy="16" r="1.7" />
          </svg>
        </button>
        {open && (
          <div className="animate-fade-in absolute right-0 z-30 mt-1 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <button type="button" className={item} onClick={() => { setOpen(false); onExport(); }}>
              ⬇ Export backup
            </button>
            <button type="button" className={item} onClick={() => { setOpen(false); fileRef.current?.click(); }}>
              ⬆ Import backup
            </button>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImport(f);
            e.target.value = "";
          }}
        />
      </div>
    </header>
  );
}
