"use client";

import { ArrowRight, Briefcase, Compass, GraduationCap, Layers, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { searchAll, SEARCH_KIND_LABELS, type SearchKind } from "@/lib/search";
import { cn } from "@/lib/utils";

const ICONS: Record<SearchKind, React.ComponentType<{ className?: string }>> = {
  university: GraduationCap,
  opportunity: Compass,
  career: Briefcase,
  program: Layers,
  skill: Sparkles,
};

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchAll(q).slice(0, 8), [q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 10);
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open) return null;

  const go = (href: string) => {
    onClose();
    router.push(href);
  };
  const submit = () => go(`/search?q=${encodeURIComponent(q.trim())}`);

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Search CareerPath" className="relative w-full max-w-xl animate-fade-in overflow-hidden rounded-lg border border-line bg-surface shadow-pop">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-4 w-4 text-ink-3" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              else if (e.key === "Enter" && q.trim()) {
                e.preventDefault();
                if (active < results.length && results[active]) go(results[active].href);
                else submit();
              }
            }}
            placeholder="Search universities, scholarships, careers, skills…"
            className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-4"
            aria-label="Search"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="quick-search-results"
          />
          <kbd className="hidden rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink-3 sm:block">ESC</kbd>
        </div>
        <div id="quick-search-results" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
          {!q.trim() && (
            <div className="px-3 py-6 text-center text-[13px] text-ink-3">
              Try <button className="link" onClick={() => setQ("business")}>business</button>, <button className="link" onClick={() => setQ("fully funded")}>fully funded</button> or <button className="link" onClick={() => setQ("Tashkent")}>Tashkent</button>
            </div>
          )}
          {q.trim() && results.length === 0 && (
            <div className="px-3 py-8 text-center">
              <p className="text-[14px] font-medium">No results found.</p>
              <p className="mt-1 text-[13px] text-ink-3">Try a broader search or different keywords.</p>
            </div>
          )}
          {results.map((r, i) => {
            const I = ICONS[r.kind];
            return (
              <button
                key={r.kind + r.id}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r.href)}
                className={cn("flex w-full items-center gap-3 rounded px-3 py-2.5 text-left", i === active ? "bg-paper" : "")}
              >
                <I className="h-4 w-4 shrink-0 text-ink-3" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] text-ink">{r.title}</span>
                  <span className="block truncate text-[12px] text-ink-3">{r.subtitle}</span>
                </span>
                <span className="shrink-0 font-mono text-[10.5px] uppercase tracking-wider text-ink-4">{SEARCH_KIND_LABELS[r.kind].replace(/s$/, "")}</span>
              </button>
            );
          })}
          {q.trim() && (
            <button
              onMouseEnter={() => setActive(results.length)}
              onClick={submit}
              className={cn("mt-1 flex w-full items-center justify-between rounded px-3 py-2.5 text-[13.5px] font-medium text-brand-700", active === results.length ? "bg-paper" : "")}
            >
              See all results for “{q.trim()}” <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
