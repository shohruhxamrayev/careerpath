import { Check } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      <div className="grid w-full lg:grid-cols-[1fr_1.05fr]">
        <aside className="relative hidden overflow-hidden border-r border-line bg-brand-800 p-12 text-brand-50 lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full border border-white/10" aria-hidden />
          <div className="pointer-events-none absolute -right-8 -top-8 h-[260px] w-[260px] rounded-full border border-white/10" aria-hidden />
          <LogoMark className="h-9 w-9" />
          <div className="relative max-w-md">
            <p className="display text-[34px] leading-[1.15] text-white">One profile. Every opportunity that fits it.</p>
            <ul className="mt-8 space-y-3 text-[14px] text-brand-100">
              {["Profile Match for universities and scholarships, with reasons", "Eligibility checked against published requirements", "A planner for deadlines, tasks and application status"].map((t) => (
                <li key={t} className="flex gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-200" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <p className="relative text-[12px] text-brand-200">Matches are informational and never predict admission.</p>
        </aside>
        <div className="flex items-center justify-center px-4 py-12 sm:px-8">
          <div className="w-full max-w-[400px]">
            <h1 className="display text-[32px] leading-tight">{title}</h1>
            {subtitle && <p className="mt-2 text-[14px] text-ink-3">{subtitle}</p>}
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DevAuthNotice() {
  return (
    <p className="mt-6 rounded border border-line bg-surface px-3 py-2.5 text-[12px] leading-relaxed text-ink-3">
      <span className="font-medium text-ink-2">Local mode:</span> accounts and data are stored securely in this browser. Connect Supabase to sync across devices.
    </p>
  );
}
