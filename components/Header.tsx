"use client";

import { useEffect, useRef, useState } from "react";
import type { AuthState } from "@/lib/auth";
import type { CloudSync, SyncStatus } from "@/lib/useCloudSync";

interface Props {
  auth: AuthState;
  sync: CloudSync;
  onSignIn: () => void;
  onSignOut: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

const DOT: Record<SyncStatus, string> = {
  off: "bg-slate-400",
  checking: "bg-amber-400 animate-pulse",
  saving: "bg-amber-400 animate-pulse",
  synced: "bg-emerald-500",
  waiting: "bg-amber-500",
  paused: "bg-amber-500",
  error: "bg-rose-500",
};

function ago(t: number | null): string {
  if (!t) return "";
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  return new Date(t).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function statusText(sync: CloudSync): string {
  switch (sync.status) {
    case "checking":
      return "Checking your account…";
    case "saving":
      return "Saving to your account…";
    case "synced":
      return `Saved to your account · ${ago(sync.lastSyncedAt)}`;
    case "waiting":
      return "Choose which copy to keep";
    case "paused":
      return "Sync paused until you choose a copy";
    case "error":
      return sync.error ?? "Couldn't sync";
    default:
      return "";
  }
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export default function Header({ auth, sync, onSignIn, onSignOut, onExport, onImport }: Props) {
  const [open, setOpen] = useState(false);
  const [today, setToday] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const account = auth.status === "signedIn" ? auth.account : null;

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

      <div className="relative flex items-center gap-1" ref={menuRef}>
        {auth.status === "signedOut" && (
          <button
            type="button"
            onClick={onSignIn}
            disabled={auth.busy}
            className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium shadow-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
          >
            <GoogleIcon />
            Sign in
          </button>
        )}
        {account && (
          <button type="button" onClick={() => setOpen((o) => !o)} aria-label={`Account: ${statusText(sync)}`} className="relative rounded-full p-1">
            {account.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={account.avatarUrl} alt="" referrerPolicy="no-referrer" className="h-8 w-8 rounded-full" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600 text-sm font-semibold text-white">
                {account.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className={`absolute right-0.5 bottom-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-slate-50 dark:ring-slate-950 ${DOT[sync.status]}`} />
          </button>
        )}
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
          <div className="animate-fade-in absolute top-full right-0 z-30 mt-1 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            {account && (
              <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <p className="truncate text-sm font-semibold">{account.name}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{account.email}</p>
                <p className="mt-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[sync.status]}`} />
                  {statusText(sync)}
                </p>
              </div>
            )}
            {account && (
              <button type="button" className={item} onClick={() => { setOpen(false); sync.syncNow(); }}>
                ⟳ Sync now
              </button>
            )}
            {auth.status === "signedOut" && (
              <button type="button" className={item} onClick={() => { setOpen(false); onSignIn(); }}>
                Sign in with Google to save to your account
              </button>
            )}
            <button type="button" className={item} onClick={() => { setOpen(false); onExport(); }}>
              ⬇ Export backup file
            </button>
            <button type="button" className={item} onClick={() => { setOpen(false); fileRef.current?.click(); }}>
              ⬆ Import backup file
            </button>
            {account && (
              <button type="button" className={`${item} text-rose-600 dark:text-rose-400`} onClick={() => { setOpen(false); onSignOut(); }}>
                Sign out
              </button>
            )}
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
