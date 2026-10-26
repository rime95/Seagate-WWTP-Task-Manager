"use client";

import type { SyncPrompt } from "@/lib/useCloudSync";
import Sheet from "./Sheet";

const when = (t: number) =>
  t ? new Date(t).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "earlier";

/** Both this device and the account changed since they last synced: the user picks which copy to keep. */
export default function SyncPromptSheet({ prompt, busy, error, onChoose }: { prompt: SyncPrompt; busy: boolean; error: string | null; onChoose: (c: "cloud" | "local" | "later") => void }) {
  return (
    <Sheet title="Two different copies" onClose={() => onChoose("later")}>
      <p className="mb-4 text-[15px] text-slate-600 dark:text-slate-300">
        This device and your account were both changed since they last synced. Choose which copy to keep. The other one is replaced.
      </p>
      <div className="mb-5 grid gap-2 text-sm">
        <div className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
          <p className="font-medium">Your account</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Saved {when(prompt.cloud.savedAt)}
            {prompt.cloud.device ? ` from a ${prompt.cloud.device}` : ""}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
          <p className="font-medium">This device</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Last changed {when(prompt.localChangedAt)}</p>
        </div>
      </div>
      {error && <p className="mb-3 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      <div className="grid gap-2">
        <button type="button" disabled={busy} onClick={() => onChoose("cloud")} className="rounded-lg bg-cyan-600 py-3 text-sm font-semibold text-white disabled:opacity-50">
          Use my account’s copy
        </button>
        <button type="button" disabled={busy} onClick={() => onChoose("local")} className="rounded-lg bg-slate-100 py-3 text-sm font-medium disabled:opacity-50 dark:bg-slate-800">
          Keep this device’s copy
        </button>
        <button type="button" disabled={busy} onClick={() => onChoose("later")} className="py-2 text-sm text-slate-500 dark:text-slate-400">
          Decide later
        </button>
      </div>
    </Sheet>
  );
}
