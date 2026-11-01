"use client";

import { Bookmark, BookmarkCheck, CalendarPlus, CalendarCheck } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Input, Modal, Select, buttonClass } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { STATUS_LABELS, STATUSES } from "@/lib/data/taxonomy";
import { useApp } from "@/lib/store/AppProvider";
import type { ApplicationStatus, DeadlineInfo, ItemKind } from "@/lib/types";
import { cn } from "@/lib/utils";

function useRequireUser() {
  const { user } = useApp();
  const router = useRouter();
  const path = usePathname();
  const toast = useToast();
  return (verb: string) => {
    if (user) return true;
    toast.info(`Log in to ${verb}.`);
    router.push(`/login?next=${encodeURIComponent(path)}`);
    return false;
  };
}

export function SaveButton({ kind, slug, title, variant = "icon", className }: { kind: ItemKind; slug: string; title: string; variant?: "icon" | "button"; className?: string }) {
  const { isSaved, toggleSave } = useApp();
  const toast = useToast();
  const require = useRequireUser();
  const saved = isSaved(kind, slug);
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!require("save items")) return;
    const now = toggleSave(kind, slug);
    if (now) toast.success(`Saved ${title}.`, { label: "View planner", href: "/planner?tab=saved" });
    else toast.info(`Removed ${title} from saved.`);
  };
  const Icon = saved ? BookmarkCheck : Bookmark;
  if (variant === "button") {
    return (
      <Button variant="secondary" onClick={onClick} aria-pressed={saved} className={className}>
        <Icon className={cn("h-4 w-4", saved && "text-brand-600")} /> {saved ? "Saved" : "Save"}
      </Button>
    );
  }
  return (
    <button
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from saved` : `Save ${title}`}
      title={saved ? "Saved" : "Save"}
      className={cn("relative z-10 flex h-8 w-8 items-center justify-center rounded border transition-colors", saved ? "border-brand-200 bg-brand-50 text-brand-700" : "border-line bg-surface text-ink-3 hover:border-line-strong hover:text-ink", className)}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function AddToPlannerButton({
  kind,
  slug,
  title,
  subtitle,
  deadlines,
  size = "md",
  className,
}: {
  kind: "university" | "opportunity";
  slug: string;
  title: string;
  subtitle?: string;
  deadlines: DeadlineInfo[];
  size?: "sm" | "md";
  className?: string;
}) {
  const { findApplication, addApplication, isSaved, toggleSave, addTask } = useApp();
  const toast = useToast();
  const require = useRequireUser();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("interested");
  const [taskHint, setTaskHint] = useState(true);
  const existing = findApplication(kind, slug);

  if (existing) {
    return (
      <Link href={`/planner?app=${existing.id}`} className={buttonClass("subtle", size, className)}>
        <CalendarCheck className="h-4 w-4" /> In planner · {STATUS_LABELS[existing.status]}
      </Link>
    );
  }

  const submit = () => {
    const app = addApplication({ kind, slug, title, subtitle, deadline: date || undefined, status });
    if (!isSaved(kind, slug)) toggleSave(kind, slug);
    if (taskHint) addTask({ title: `Confirm requirements and deadline for ${title}`, applicationId: app.id, due: undefined });
    setOpen(false);
    toast.success(`Added ${title} to your planner.`, { label: "Open planner", href: "/planner" });
  };

  return (
    <>
      <Button
        variant="primary"
        size={size}
        className={className}
        onClick={(e) => {
          e.preventDefault();
          if (require("use the planner")) setOpen(true);
        }}
      >
        <CalendarPlus className="h-4 w-4" /> Add to planner
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add to planner"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>Add to planner</Button>
          </>
        }
      >
        <p className="text-[14px] font-medium">{title}</p>
        {subtitle && <p className="text-[13px] text-ink-3">{subtitle}</p>}
        {deadlines.length > 0 && (
          <div className="mt-4 rounded border border-line bg-paper p-3 text-[13px]">
            <p className="font-medium text-ink-2">Typical timing (confirm on the official site)</p>
            <ul className="mt-1.5 space-y-1 text-ink-3">
              {deadlines.map((d) => (
                <li key={d.label}>
                  <span className="text-ink-2">{d.label}:</span> {d.timing}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Your deadline (optional)" htmlFor="pl-date" hint="Enter the date once you've confirmed it.">
            <Input id="pl-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Status" htmlFor="pl-status">
            <Select id="pl-status" value={status} onChange={(e) => setStatus(e.target.value as ApplicationStatus)}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </Select>
          </Field>
        </div>
        <label className="mt-4 flex items-center gap-2 text-[13px] text-ink-2">
          <input type="checkbox" checked={taskHint} onChange={(e) => setTaskHint(e.target.checked)} className="h-4 w-4 accent-brand-600" />
          Also add a task to confirm requirements and the deadline on the official site
        </label>
      </Modal>
    </>
  );
}
