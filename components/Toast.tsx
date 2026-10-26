"use client";

import { useEffect } from "react";

export interface ToastState {
  id: number;
  message: string;
  onUndo?: () => void;
}

export default function Toast({ toast, onDismiss }: { toast: ToastState | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, 4500);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4" role="status" aria-live="polite">
      <div
        key={toast.id}
        className="animate-fade-in pointer-events-auto flex items-center gap-4 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900"
      >
        <span>{toast.message}</span>
        {toast.onUndo && (
          <button
            type="button"
            onClick={() => {
              toast.onUndo?.();
              onDismiss();
            }}
            className="font-semibold text-cyan-300 dark:text-cyan-700"
          >
            Undo
          </button>
        )}
      </div>
    </div>
  );
}
