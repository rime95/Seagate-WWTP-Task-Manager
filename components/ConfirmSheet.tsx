"use client";

import Sheet from "./Sheet";

export interface ConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}

/** In-app replacement for window.confirm(), styled like the other sheets. */
export default function ConfirmSheet({ state, onClose }: { state: ConfirmState; onClose: () => void }) {
  return (
    <Sheet title={state.title} onClose={onClose}>
      <p className="mb-6 text-[15px] text-slate-600 dark:text-slate-300">{state.message}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-lg bg-slate-100 py-3 text-sm font-medium dark:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="button"
          autoFocus
          onClick={() => {
            state.onConfirm();
            onClose();
          }}
          className="flex-1 rounded-lg bg-cyan-600 py-3 text-sm font-semibold text-white"
        >
          {state.confirmLabel}
        </button>
      </div>
    </Sheet>
  );
}
