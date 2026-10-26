"use client";

import { useRef, useState } from "react";

const THRESHOLD = 80;

interface Props {
  children: React.ReactNode;
  onSwipeRight: () => void; // complete / toggle
  onSwipeLeft: () => void; // delete
  rightLabel: string;
}

/** Touch swipe actions (Todoist-style): swipe right to complete, swipe left to delete. */
export default function SwipeRow({ children, onSwipeRight, onSwipeLeft, rightLabel }: Props) {
  const [dx, setDx] = useState(0);
  const start = useRef<{ x: number; y: number; locked: boolean | null } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "touch") return;
    start.current = { x: e.clientX, y: e.clientY, locked: null };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s) return;
    const mx = e.clientX - s.x;
    const my = e.clientY - s.y;
    if (s.locked === null && (Math.abs(mx) > 8 || Math.abs(my) > 8)) {
      s.locked = Math.abs(mx) > Math.abs(my); // horizontal gesture?
    }
    if (s.locked) setDx(Math.max(-140, Math.min(140, mx)));
  };

  const end = () => {
    if (dx > THRESHOLD) onSwipeRight();
    else if (dx < -THRESHOLD) onSwipeLeft();
    start.current = null;
    setDx(0);
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {dx !== 0 && (
        <div
          className={`absolute inset-0 flex items-center px-5 text-sm font-semibold text-white ${
            dx > 0 ? "justify-start bg-emerald-500" : "justify-end bg-rose-500"
          }`}
        >
          {dx > 0 ? rightLabel : "Delete"}
        </div>
      )}
      <div
        style={{ transform: dx ? `translateX(${dx}px)` : undefined, touchAction: "pan-y" }}
        className={dx === 0 ? "transition-transform" : ""}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
      >
        {children}
      </div>
    </div>
  );
}
