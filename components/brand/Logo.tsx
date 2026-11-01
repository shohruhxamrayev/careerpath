import Link from "next/link";
import { cn } from "@/lib/utils";

/** CareerPath mark: two waypoints joined by a stepped path, inside a square frame. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={cn("h-7 w-7", className)} aria-hidden>
      <defs>
        <linearGradient id="cpg" x1="0" y1="28" x2="28" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0E3B2E" />
          <stop offset="1" stopColor="#14563F" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="27" height="27" rx="7" fill="url(#cpg)" stroke="rgba(94,234,176,0.35)" />
      <path d="M8 19.5 H13 V8.5 H20" fill="none" stroke="#E9FFF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="19.5" r="2.2" fill="#E9FFF6" />
      <circle cx="20" cy="8.5" r="2.4" fill="#5EEAB0" />
    </svg>
  );
}

export function Logo({ className, href = "/", tone = "dark" }: { className?: string; href?: string; tone?: "dark" | "light" }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 rounded", className)} aria-label="CareerPath home">
      <LogoMark />
      <span className={cn("font-display text-[18px] font-semibold tracking-[-0.03em]", tone === "dark" ? "text-white" : "text-ink")}>
        career<span className={tone === "dark" ? "text-mint" : "text-brand-600"}>path</span>
      </span>
    </Link>
  );
}
