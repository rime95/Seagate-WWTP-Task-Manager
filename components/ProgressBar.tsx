export default function ProgressBar({ done, total, unit = "done" }: { done: number; total: number; unit?: string }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const complete = total > 0 && done === total;
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${complete ? "bg-emerald-500" : "bg-cyan-600"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 text-xs font-medium text-slate-500 tabular-nums dark:text-slate-400">
        {complete ? "All done 🎉" : `${done} / ${total} ${unit}`}
      </span>
    </div>
  );
}
