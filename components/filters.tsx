"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Select } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Filter state stored in the URL so filtered views can be shared and survive reloads. */
export function useUrlFilters<T extends Record<string, string>>(defaults: T) {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const initial = useMemo(() => {
    const v = { ...defaults };
    for (const k of Object.keys(defaults)) {
      const p = params.get(k);
      if (p != null) (v as Record<string, string>)[k] = p;
    }
    return v;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [state, setState] = useState<T>(initial);
  const lastQs = useRef(params.toString());

  // Write state → URL (debounced).
  useEffect(() => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(state)) if (v && v !== defaults[k]) sp.set(k, v);
    const qs = sp.toString();
    if (qs === lastQs.current) return;
    const t = setTimeout(() => {
      lastQs.current = qs;
      router.replace(qs ? `${path}?${qs}` : path, { scroll: false });
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // URL changed from outside (e.g. global search, back button) → update state.
  useEffect(() => {
    const cur = params.toString();
    if (cur === lastQs.current) return;
    lastQs.current = cur;
    const v = { ...defaults };
    for (const k of Object.keys(defaults)) {
      const p = params.get(k);
      if (p != null) (v as Record<string, string>)[k] = p;
    }
    setState(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const set = useCallback((k: keyof T, v: string) => setState((s) => ({ ...s, [k]: v })), []);
  const reset = useCallback(() => setState((s) => ({ ...defaults, q: (s as Record<string, string>).q ?? "" } as T)), [defaults]);
  const activeCount = Object.entries(state).filter(([k, v]) => k !== "q" && k !== "sort" && v && v !== defaults[k]).length;
  return { state, set, reset, activeCount };
}

export function SearchInput({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <div className="relative flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="input h-11 pl-9 pr-9 text-[14.5px]"
      />
      {value && (
        <button onClick={() => onChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-4 hover:text-ink" aria-label="Clear search">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function FilterSelect({ label, value, onChange, options, id }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][]; id: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[12px] font-medium text-ink-3">{label}</label>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={cn("h-9 py-1.5 text-[13.5px]", value && "border-brand-500 bg-brand-50/40")}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </Select>
    </div>
  );
}

export function FilterToggle({ label, checked, onChange, id }: { label: string; checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5 py-1 text-[13.5px] text-ink-2">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded accent-brand-600" />
      {label}
    </label>
  );
}

/** Sidebar on desktop, slide-over panel on mobile. */
function useIsDesktop() {
  const [v, setV] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setV(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return v;
}

export function FilterPanel({ children, activeCount, onReset, resultCount }: { children: React.ReactNode; activeCount: number; onReset: () => void; resultCount: number }) {
  const [open, setOpen] = useState(false);
  const isDesktop = useIsDesktop();
  useEffect(() => {
    if (isDesktop) setOpen(false);
  }, [isDesktop]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  const body = (
    <div className="space-y-4">
      {children}
      {activeCount > 0 && (
        <button onClick={onReset} className="text-[13px] font-medium text-brand-700 hover:underline">
          Clear all filters ({activeCount})
        </button>
      )}
    </div>
  );
  return (
    <>
      <div className="lg:hidden">
        <Button variant="secondary" onClick={() => setOpen(true)} className="h-11 w-full sm:w-auto" aria-expanded={open}>
          <SlidersHorizontal className="h-4 w-4" /> Filters{activeCount > 0 && <span className="rounded bg-brand-700 px-1.5 font-mono text-[11px] text-white">{activeCount}</span>}
        </Button>
      </div>
      {/* Controls render in exactly one place at a time, so form IDs stay unique. */}
      <aside className="hidden lg:block" aria-label="Filters">
        {isDesktop !== false && !open && (
          <div className="card sticky top-24 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[14px] font-semibold">Filters</h2>
            </div>
            {body}
          </div>
        )}
      </aside>
      {open && isDesktop === false && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} aria-hidden />
          <div role="dialog" aria-modal="true" aria-label="Filters" className="absolute inset-x-0 bottom-0 max-h-[88vh] animate-fade-in overflow-hidden rounded-t-lg bg-surface shadow-pop">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-[16px] font-semibold">Filters</h2>
              <button onClick={() => setOpen(false)} className="rounded p-1 text-ink-3" aria-label="Close filters"><X className="h-5 w-5" /></button>
            </div>
            <div className="max-h-[62vh] overflow-y-auto px-5 py-4">{body}</div>
            <div className="border-t border-line p-4">
              <Button className="w-full" size="lg" onClick={() => setOpen(false)}>Show {resultCount} results</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
