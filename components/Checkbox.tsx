"use client";

interface Props {
  checked: boolean;
  onChange: () => void;
  label: string;
  size?: "md" | "sm";
  tone?: "brand" | "amber";
}

export default function Checkbox({ checked, onChange, label, size = "md", tone = "brand" }: Props) {
  const box = size === "md" ? "h-6 w-6" : "h-5 w-5";
  const on = tone === "amber" ? "bg-amber-500 border-amber-500" : "bg-cyan-600 border-cyan-600";
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className="-m-2 flex shrink-0 items-center justify-center p-2"
    >
      <span
        key={String(checked)}
        className={`${box} flex items-center justify-center rounded-full border-2 transition-colors ${
          checked ? `${on} animate-pop text-white` : "border-slate-300 hover:border-cyan-500 dark:border-slate-600"
        }`}
      >
        {checked && (
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  );
}
