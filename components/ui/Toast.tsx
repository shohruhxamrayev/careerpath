"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import Link from "next/link";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type Kind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  kind: Kind;
  message: string;
  action?: { label: string; href: string };
}
interface ToastApi {
  success(m: string, action?: ToastItem["action"]): void;
  error(m: string, action?: ToastItem["action"]): void;
  info(m: string, action?: ToastItem["action"]): void;
}

const Ctx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const n = useRef(0);
  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (kind: Kind, message: string, action?: ToastItem["action"]) => {
      const id = ++n.current;
      setItems((xs) => [...xs.slice(-2), { id, kind, message, action }]);
      setTimeout(() => dismiss(id), kind === "error" ? 6000 : 3800);
    },
    [dismiss],
  );
  const api = useMemo<ToastApi>(
    () => ({ success: (m, a) => push("success", m, a), error: (m, a) => push("error", m, a), info: (m, a) => push("info", m, a) }),
    [push],
  );
  const Icon = { success: CheckCircle2, error: XCircle, info: Info };
  const tone = { success: "text-ok", error: "text-bad", info: "text-info" };

  return (
    <Ctx.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end">
        {items.map((t) => {
          const I = Icon[t.kind];
          return (
            <div key={t.id} role="status" className="pointer-events-auto flex w-full max-w-sm animate-fade-in items-start gap-3 rounded-md border border-line bg-surface px-4 py-3 shadow-pop">
              <I className={`mt-0.5 h-4 w-4 shrink-0 ${tone[t.kind]}`} aria-hidden />
              <div className="min-w-0 flex-1 text-[13.5px] leading-snug text-ink-2">
                {t.message}
                {t.action && (
                  <Link href={t.action.href} onClick={() => dismiss(t.id)} className="ml-1.5 font-medium text-brand-600 hover:underline">
                    {t.action.label}
                  </Link>
                )}
              </div>
              <button onClick={() => dismiss(t.id)} className="rounded p-0.5 text-ink-4 hover:text-ink" aria-label="Dismiss notification">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useToast must be used inside <ToastProvider>");
  return v;
}
