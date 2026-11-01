import Link from "next/link";
import { cn } from "@/lib/utils";

/** CareerPath mark: two waypoints joined by a stepped path, inside a square frame. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={cn("h-7 w-7", className)} aria-hidden>
      <rect x="0.5" y="0.5" width="27" height="27" rx="6" fill="#1B463B" />
      <path d="M8 19.5 H13 V8.5 H20" fill="none" stroke="#EEF4F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="19.5" r="2.2" fill="#EEF4F1" />
      <circle cx="20" cy="8.5" r="2.2" fill="#AFCBBF" />
    </svg>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 rounded", className)} aria-label="CareerPath home">
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-[-0.02em] text-ink">
        career<span className="text-brand-600">path</span>
      </span>
    </Link>
  );
}
