"use client";

import { ArrowUp } from "lucide-react";

export function BackToTop() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-white/10 px-2.5 text-night-300 transition-colors hover:border-mint/40 hover:text-white"
    >
      <ArrowUp className="h-3 w-3" aria-hidden /> Top
    </button>
  );
}
