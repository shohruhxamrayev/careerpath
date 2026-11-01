"use client";

import {
  AlertCircle, Bookmark, CalendarDays, Check, ChevronLeft, ChevronRight, ClipboardList, LayoutGrid, ListChecks, Plus, Trash2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AddToPlannerButton } from "@/components/actions";
import { Badge, Button, ButtonLink, ConfirmDialog, EmptyState, Field, Input, Modal, Select } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { getCareer } from "@/lib/data/careers";
import { getOpportunity } from "@/lib/data/opportunities";
import { STATUS_LABELS, STATUSES } from "@/lib/data/taxonomy";
import { getUniversity } from "@/lib/data/universities";
import { useApp } from "@/lib/store/AppProvider";
import type { Application, ApplicationStatus, PlannerTask } from "@/lib/types";
import { cn, daysUntil, formatDate, parseISODate, relativeDays, toISODate, todayISO } from "@/lib/utils";

type Tab = "overview" | "applications" | "tasks" | "calendar" | "saved";
const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "applications", label: "Applications", icon: ClipboardList },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "saved", label: "Saved", icon: Bookmark },
];

const STATUS_TONE: Record<ApplicationStatus, "neutral" | "info" | "brand" | "warn" | "ok" | "bad"> = {
  interested: "neutral", preparing: "info", applied: "brand", interview: "warn", accepted: "ok", rejected: "bad",
};

export function Planner() {
  const { data } = useApp();
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const tab = (TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : "overview") as Tab;
  const [editing, setEditing] = useState<Application | null>(null);
  const [newApp, setNewApp] = useState(false);
  const [newTask, setNewTask] = useState<Partial<PlannerTask> | null>(null);

  const setTab = (t: Tab) => router.replace(t === "overview" ? path : `${path}?tab=${t}`, { scroll: false });

  useEffect(() => {
    const id = params.get("app");
    if (id) {
      const a = data!.applications.find((x) => x.id === id);
      if (a) setEditing(a);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const apps = data!.applications;
  const tasks = data!.tasks;

  return (
    <div className="pb-16">
      <div className="border-b border-line bg-surface">
        <div className="container pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow mb-2">Planner</p>
              <h1 className="display text-[34px] leading-tight sm:text-[40px]">Your applications</h1>
              <p className="mt-2 text-[14.5px] text-ink-3">{apps.length} applications · {tasks.filter((t) => !t.done).length} open tasks</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setNewTask({})}><Plus className="h-4 w-4" /> Task</Button>
              <Button onClick={() => setNewApp(true)}><Plus className="h-4 w-4" /> Application</Button>
            </div>
          </div>
          <div role="tablist" aria-label="Planner views" className="scrollbar-none -mx-4 mt-6 flex gap-1 overflow-x-auto px-4">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn("flex items-center gap-2 whitespace-nowrap border-b-2 px-3 pb-3 pt-1 text-[14px] transition-colors", tab === t.id ? "border-brand-600 font-medium text-ink" : "border-transparent text-ink-3 hover:text-ink")}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container py-8" role="tabpanel">
        {tab === "overview" && <Overview onEdit={setEditing} onAddTask={() => setNewTask({})} onAddApp={() => setNewApp(true)} />}
        {tab === "applications" && <Applications onEdit={setEditing} onAdd={() => setNewApp(true)} />}
        {tab === "tasks" && <Tasks onAdd={() => setNewTask({})} />}
        {tab === "calendar" && <CalendarView onEdit={setEditing} onAddTask={(due) => setNewTask({ due })} />}
        {tab === "saved" && <Saved />}
      </div>

      <ApplicationModal app={editing} onClose={() => { setEditing(null); if (params.get("app")) router.replace(path + (tab !== "overview" ? `?tab=${tab}` : ""), { scroll: false }); }} />
      <NewApplicationModal open={newApp} onClose={() => setNewApp(false)} />
      <TaskModal initial={newTask} onClose={() => setNewTask(null)} />
    </div>
  );
}

// ───────────── Overview ─────────────

function Overview({ onEdit, onAddTask, onAddApp }: { onEdit: (a: Application) => void; onAddTask: () => void; onAddApp: () => void }) {
  const { data, updateTask } = useApp();
  const apps = data!.applications;
  const tasks = data!.tasks;
  const today = todayISO();
  const upcoming = useMemo(() => {
    const items = [
      ...apps.filter((a) => a.deadline && daysUntil(a.deadline) >= 0 && !["accepted", "rejected"].includes(a.status)).map((a) => ({ id: a.id, date: a.deadline!, title: a.title, kind: "Deadline" as const, app: a })),
      ...tasks.filter((t) => !t.done && t.due && daysUntil(t.due) > 0).map((t) => ({ id: t.id, date: t.due!, title: t.title, kind: "Task" as const, app: undefined })),
    ];
    return items.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);
  }, [apps, tasks]);
  const todays = tasks.filter((t) => !t.done && t.due === today);
  const overdue = tasks.filter((t) => !t.done && t.due && t.due < today);
  const counts = STATUSES.map((s) => ({ s, n: apps.filter((a) => a.status === s).length }));
  const submitted = apps.filter((a) => ["applied", "interview", "accepted", "rejected"].includes(a.status)).length;

  if (!apps.length && !tasks.length) {
    return (
      <EmptyState
        icon={<ClipboardList />}
        title="Your planner is empty"
        body="Add universities or opportunities from their pages, or create a custom application. Then add deadlines and tasks to stay on track."
        action={<><ButtonLink href="/for-you">See recommendations</ButtonLink><Button variant="secondary" onClick={onAddApp}>Add custom application</Button></>}
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="card p-5 lg:col-span-3" aria-labelledby="progress-h">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="progress-h" className="text-[15px] font-semibold">Application progress</h2>
          <p className="text-[13px] text-ink-3">{submitted} of {apps.length} submitted</p>
        </div>
        <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-line/60" role="img" aria-label={counts.map((c) => `${STATUS_LABELS[c.s]}: ${c.n}`).join(", ")}>
          {counts.filter((c) => c.n).map((c) => (
            <div key={c.s} style={{ width: `${(c.n / Math.max(1, apps.length)) * 100}%` }} className={cn({ interested: "bg-ink-4", preparing: "bg-info", applied: "bg-brand-600", interview: "bg-warn", accepted: "bg-ok", rejected: "bg-bad" }[c.s])} />
          ))}
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {counts.map((c) => (
            <div key={c.s}>
              <dt className="text-[12px] text-ink-3">{STATUS_LABELS[c.s]}</dt>
              <dd className="font-mono text-[20px]">{c.n}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card p-5 lg:col-span-2" aria-labelledby="up-h">
        <h2 id="up-h" className="mb-4 text-[15px] font-semibold">Upcoming deadlines</h2>
        {upcoming.length ? (
          <ul className="divide-y divide-line">
            {upcoming.map((u) => (
              <li key={u.kind + u.id} className="flex items-center gap-4 py-3">
                <div className="w-14 shrink-0 text-center">
                  <p className="font-mono text-[11px] uppercase text-ink-3">{parseISODate(u.date).toLocaleDateString("en-GB", { month: "short" })}</p>
                  <p className="font-mono text-[20px] leading-none">{parseISODate(u.date).getDate()}</p>
                </div>
                <div className="min-w-0 flex-1">
                  {u.app ? <button onClick={() => onEdit(u.app!)} className="truncate text-left text-[14px] font-medium hover:text-brand-700">{u.title}</button> : <p className="truncate text-[14px]">{u.title}</p>}
                  <p className="text-[12.5px] text-ink-3">{u.kind} · {relativeDays(u.date)}</p>
                </div>
                <Badge tone={daysUntil(u.date) <= 7 ? "warn" : "neutral"}>{daysUntil(u.date) <= 7 ? "Soon" : u.kind}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13.5px] text-ink-3">No upcoming dates. Open an application and add its confirmed deadline.</p>
        )}
      </section>

      <div className="space-y-6">
        <section className="card p-5" aria-labelledby="today-h">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="today-h" className="text-[15px] font-semibold">Today&apos;s tasks</h2>
            <button onClick={onAddTask} className="rounded p-1 text-ink-3 hover:bg-paper hover:text-ink" aria-label="Add task"><Plus className="h-4 w-4" /></button>
          </div>
          {todays.length ? <TaskList tasks={todays} onToggle={(t) => updateTask(t.id, { done: !t.done })} /> : <p className="text-[13.5px] text-ink-3">Nothing due today.</p>}
        </section>
        <section className={cn("card p-5", overdue.length > 0 && "border-bad/30")} aria-labelledby="over-h">
          <h2 id="over-h" className="mb-3 flex items-center gap-2 text-[15px] font-semibold">
            {overdue.length > 0 && <AlertCircle className="h-4 w-4 text-bad" />} Overdue
          </h2>
          {overdue.length ? <TaskList tasks={overdue} onToggle={(t) => updateTask(t.id, { done: !t.done })} /> : <p className="text-[13.5px] text-ink-3">You&apos;re all caught up.</p>}
        </section>
      </div>
    </div>
  );
}

function TaskList({ tasks, onToggle, onDelete }: { tasks: PlannerTask[]; onToggle: (t: PlannerTask) => void; onDelete?: (t: PlannerTask) => void }) {
  const { data } = useApp();
  return (
    <ul className="space-y-1">
      {tasks.map((t) => {
        const app = data!.applications.find((a) => a.id === t.applicationId);
        const overdue = !t.done && t.due && daysUntil(t.due) < 0;
        return (
          <li key={t.id} className="group flex items-start gap-3 rounded px-1 py-2 hover:bg-paper">
            <button
              onClick={() => onToggle(t)}
              role="checkbox"
              aria-checked={t.done}
              aria-label={`Mark "${t.title}" as ${t.done ? "not done" : "done"}`}
              className={cn("mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition-colors", t.done ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong bg-surface hover:border-brand-500")}
            >
              {t.done && <Check className="h-3 w-3" />}
            </button>
            <div className="min-w-0 flex-1">
              <p className={cn("text-[14px]", t.done && "text-ink-4 line-through")}>{t.title}</p>
              <p className="text-[12px] text-ink-3">
                {t.due && <span className={cn(overdue && "font-medium text-bad")}>{formatDate(t.due, { day: "numeric", month: "short" })} · {relativeDays(t.due)}</span>}
                {t.due && app && " · "}
                {app && <span>{app.title}</span>}
              </p>
            </div>
            {onDelete && (
              <button onClick={() => onDelete(t)} className="rounded p-1 text-ink-4 opacity-100 hover:text-bad sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100" aria-label={`Delete task "${t.title}"`}>
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ───────────── Applications ─────────────

function Applications({ onEdit, onAdd }: { onEdit: (a: Application) => void; onAdd: () => void }) {
  const { data, updateApplication } = useApp();
  const toast = useToast();
  const [filter, setFilter] = useState<ApplicationStatus | "">("");
  const apps = data!.applications.filter((a) => !filter || a.status === filter).sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"));

  if (!data!.applications.length) {
    return <EmptyState icon={<ClipboardList />} title="No applications yet" body="Use “Add to planner” on any university or opportunity, or add a custom one." action={<><ButtonLink href="/universities">Browse universities</ButtonLink><Button variant="secondary" onClick={onAdd}>Add custom application</Button></>} />;
  }
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label htmlFor="st-filter" className="text-[13px] text-ink-3">Status</label>
        <Select id="st-filter" value={filter} onChange={(e) => setFilter(e.target.value as ApplicationStatus | "")} className="h-9 w-44 py-1.5 text-[13.5px]">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </Select>
      </div>
      {apps.length === 0 ? (
        <EmptyState title="No applications with this status" body="Try a different status filter." action={<Button variant="secondary" onClick={() => setFilter("")}>Show all</Button>} />
      ) : (
        <div className="overflow-hidden rounded-md border border-line bg-surface">
          <table className="hidden w-full text-left md:table">
            <thead className="border-b border-line bg-paper text-[12px] text-ink-3">
              <tr>
                <th className="px-4 py-2.5 font-medium">Application</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Deadline</th>
                <th className="px-4 py-2.5 font-medium">Tasks</th>
                <th className="px-4 py-2.5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {apps.map((a) => {
                const t = data!.tasks.filter((x) => x.applicationId === a.id);
                return (
                  <tr key={a.id} className="text-[14px]">
                    <td className="px-4 py-3">
                      <button onClick={() => onEdit(a)} className="text-left font-medium hover:text-brand-700">{a.title}</button>
                      {a.subtitle && <p className="text-[12.5px] text-ink-3">{a.subtitle}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <Select aria-label={`Status for ${a.title}`} value={a.status} onChange={(e) => { updateApplication(a.id, { status: e.target.value as ApplicationStatus }); toast.success(`Status updated to ${STATUS_LABELS[e.target.value as ApplicationStatus]}.`); }} className="h-8 w-36 py-1 text-[13px]">
                        {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-[13.5px]">
                      {a.deadline ? <><span>{formatDate(a.deadline)}</span><span className={cn("block text-[12px]", daysUntil(a.deadline) < 0 ? "text-bad" : "text-ink-3")}>{relativeDays(a.deadline)}</span></> : <button onClick={() => onEdit(a)} className="text-[13px] text-brand-700 hover:underline">Add date</button>}
                    </td>
                    <td className="px-4 py-3 font-mono text-[13px] text-ink-3">{t.filter((x) => x.done).length}/{t.length}</td>
                    <td className="px-4 py-3 text-right"><Button variant="ghost" size="sm" onClick={() => onEdit(a)}>Open</Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <ul className="divide-y divide-line md:hidden">
            {apps.map((a) => (
              <li key={a.id}>
                <button onClick={() => onEdit(a)} className="flex w-full items-start justify-between gap-3 p-4 text-left">
                  <span className="min-w-0">
                    <span className="block text-[14.5px] font-medium">{a.title}</span>
                    <span className="block text-[12.5px] text-ink-3">{a.deadline ? `${formatDate(a.deadline)} · ${relativeDays(a.deadline)}` : "No deadline set"}</span>
                  </span>
                  <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABELS[a.status]}</Badge>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ───────────── Tasks ─────────────

function Tasks({ onAdd }: { onAdd: () => void }) {
  const { data, updateTask, removeTask } = useApp();
  const toast = useToast();
  const [show, setShow] = useState<"open" | "done" | "all">("open");
  const [quick, setQuick] = useState("");
  const { addTask } = useApp();
  const list = data!.tasks
    .filter((t) => (show === "all" ? true : show === "open" ? !t.done : t.done))
    .sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999"));

  return (
    <div className="max-w-3xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!quick.trim()) return;
          addTask({ title: quick.trim() });
          setQuick("");
          toast.success("Task added.");
        }}
        className="mb-5 flex gap-2"
      >
        <Input value={quick} onChange={(e) => setQuick(e.target.value)} placeholder="Quick add a task and press Enter" aria-label="New task title" />
        <Button type="submit" variant="secondary" disabled={!quick.trim()}>Add</Button>
        <Button type="button" variant="ghost" onClick={onAdd}>With date…</Button>
      </form>
      <div className="mb-3 flex gap-1" role="group" aria-label="Show tasks">
        {(["open", "done", "all"] as const).map((s) => (
          <button key={s} onClick={() => setShow(s)} aria-pressed={show === s} className={cn("rounded px-3 py-1.5 text-[13px] capitalize", show === s ? "bg-surface font-medium shadow-card" : "text-ink-3 hover:text-ink")}>{s}</button>
        ))}
      </div>
      {list.length ? (
        <div className="card p-3">
          <TaskList
            tasks={list}
            onToggle={(t) => {
              updateTask(t.id, { done: !t.done });
              if (!t.done) toast.success("Task completed.");
            }}
            onDelete={(t) => {
              removeTask(t.id);
              toast.info("Task deleted.");
            }}
          />
        </div>
      ) : (
        <EmptyState icon={<ListChecks />} title={show === "done" ? "No completed tasks yet" : "No open tasks"} body={show === "done" ? "Completed tasks will appear here." : "Add tasks like “Request recommendation letter” or “Book IELTS”."} />
      )}
    </div>
  );
}

// ───────────── Calendar ─────────────

function CalendarView({ onEdit, onAddTask }: { onEdit: (a: Application) => void; onAddTask: (due: string) => void }) {
  const { data } = useApp();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string>(todayISO());
  const events = useMemo(() => {
    const m = new Map<string, { label: string; kind: "deadline" | "task"; done?: boolean; app?: Application }[]>();
    const push = (k: string, v: { label: string; kind: "deadline" | "task"; done?: boolean; app?: Application }) => m.set(k, [...(m.get(k) ?? []), v]);
    data!.applications.forEach((a) => a.deadline && push(a.deadline, { label: a.title, kind: "deadline", app: a }));
    data!.tasks.forEach((t) => t.due && push(t.due, { label: t.title, kind: "task", done: t.done }));
    return m;
  }, [data]);

  const start = new Date(cursor);
  start.setDate(1 - ((cursor.getDay() + 6) % 7)); // Monday-first grid
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  const today = todayISO();
  const sel = events.get(selected) ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-[15px] font-semibold">{cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</h2>
          <div className="flex gap-1">
            <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="rounded p-1.5 hover:bg-paper" aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); setSelected(today); }} className="rounded px-2 text-[13px] hover:bg-paper">Today</button>
            <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="rounded p-1.5 hover:bg-paper" aria-label="Next month"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-line bg-paper text-center text-[11px] font-medium uppercase tracking-wider text-ink-3">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="py-2" aria-hidden>{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const iso = toISODate(d);
            const ev = events.get(iso) ?? [];
            const inMonth = d.getMonth() === cursor.getMonth();
            return (
              <button
                key={iso}
                onClick={() => setSelected(iso)}
                aria-label={`${d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}${ev.length ? `, ${ev.length} item${ev.length > 1 ? "s" : ""}` : ""}`}
                aria-pressed={selected === iso}
                className={cn(
                  "relative flex min-h-[64px] flex-col items-start border-b border-r border-line p-1.5 text-left transition-colors sm:min-h-[86px] [&:nth-child(7n)]:border-r-0",
                  !inMonth && "bg-paper/60 text-ink-4",
                  selected === iso && "bg-brand-50",
                )}
              >
                <span className={cn("flex h-6 w-6 items-center justify-center rounded-full font-mono text-[12px]", iso === today && "bg-brand-700 text-white")}>{d.getDate()}</span>
                <span className="mt-1 hidden w-full space-y-0.5 sm:block">
                  {ev.slice(0, 2).map((e, i) => (
                    <span key={i} className={cn("block truncate rounded px-1 text-[11px]", e.kind === "deadline" ? "bg-warn-bg text-warn" : "bg-info-bg text-info", e.done && "line-through opacity-60")}>{e.label}</span>
                  ))}
                  {ev.length > 2 && <span className="block px-1 text-[11px] text-ink-3">+{ev.length - 2} more</span>}
                </span>
                {ev.length > 0 && <span className="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-warn sm:hidden" aria-hidden />}
              </button>
            );
          })}
        </div>
      </div>
      <aside className="card h-fit p-5">
        <h2 className="text-[15px] font-semibold">{formatDate(selected, { weekday: "long", day: "numeric", month: "long" })}</h2>
        {sel.length ? (
          <ul className="mt-3 space-y-2">
            {sel.map((e, i) => (
              <li key={i} className="flex items-start gap-2 text-[13.5px]">
                <Badge tone={e.kind === "deadline" ? "warn" : "info"}>{e.kind === "deadline" ? "Deadline" : "Task"}</Badge>
                {e.app ? <button onClick={() => onEdit(e.app!)} className="text-left hover:text-brand-700">{e.label}</button> : <span className={cn(e.done && "text-ink-4 line-through")}>{e.label}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[13.5px] text-ink-3">Nothing scheduled.</p>
        )}
        <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => onAddTask(selected)}><Plus className="h-4 w-4" /> Add task on this day</Button>
      </aside>
    </div>
  );
}

// ───────────── Saved ─────────────

function Saved() {
  const { data, toggleSave } = useApp();
  const toast = useToast();
  const saved = [...data!.saved].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  if (!saved.length) {
    return <EmptyState icon={<Bookmark />} title="Nothing saved yet" body="Use the bookmark icon on universities, opportunities and careers to keep a shortlist." action={<><ButtonLink href="/universities">Browse universities</ButtonLink><ButtonLink href="/opportunities" variant="secondary">Browse opportunities</ButtonLink></>} />;
  }
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-md border border-line bg-surface">
      {saved.map((s) => {
        const u = s.kind === "university" ? getUniversity(s.slug) : undefined;
        const o = s.kind === "opportunity" ? getOpportunity(s.slug) : undefined;
        const c = s.kind === "career" ? getCareer(s.slug) : undefined;
        const title = u?.name ?? o?.title ?? c?.title;
        if (!title) {
          return (
            <li key={s.id} className="flex items-center justify-between gap-3 p-4 text-[13.5px] text-ink-3">
              This saved item is no longer available.
              <Button variant="ghost" size="sm" onClick={() => toggleSave(s.kind, s.slug)}>Remove</Button>
            </li>
          );
        }
        const href = u ? `/universities/${s.slug}` : o ? `/opportunities/${s.slug}` : `/careers/${s.slug}`;
        return (
          <li key={s.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <Badge>{s.kind === "university" ? "University" : s.kind === "opportunity" ? "Opportunity" : "Career"}</Badge>
              <Link href={href} className="mt-1 block text-[14.5px] font-medium hover:text-brand-700">{title}</Link>
              <p className="text-[12.5px] text-ink-3">{u ? `${u.city}, ${u.country}` : o ? `${o.organization} · ${o.deadline.timing}` : c?.family}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              {u && <AddToPlannerButton kind="university" slug={u.slug} title={u.name} subtitle={`${u.city}, ${u.country}`} deadlines={u.deadlines} size="sm" />}
              {o && <AddToPlannerButton kind="opportunity" slug={o.slug} title={o.title} subtitle={o.organization} deadlines={[o.deadline]} size="sm" />}
              <Button variant="ghost" size="sm" onClick={() => { toggleSave(s.kind, s.slug); toast.info(`Removed ${title}.`); }} aria-label={`Remove ${title} from saved`}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ───────────── Modals ─────────────

function ApplicationModal({ app, onClose }: { app: Application | null; onClose: () => void }) {
  const { data, updateApplication, removeApplication, updateTask, addTask } = useApp();
  const toast = useToast();
  const [draft, setDraft] = useState<Application | null>(app);
  const [confirm, setConfirm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  useEffect(() => setDraft(app), [app]);
  if (!app || !draft) return null;
  const live = data!.applications.find((a) => a.id === app.id);
  if (!live) return null;
  const tasks = data!.tasks.filter((t) => t.applicationId === app.id);
  const href = app.kind === "university" ? `/universities/${app.slug}` : app.kind === "opportunity" ? `/opportunities/${app.slug}` : null;

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={app.title}
        size="lg"
        footer={
          <>
            <Button variant="ghost" className="text-bad sm:mr-auto" onClick={() => setConfirm(true)}><Trash2 className="h-4 w-4" /> Remove</Button>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { updateApplication(app.id, { status: draft.status, deadline: draft.deadline || undefined, notes: draft.notes }); toast.success("Application updated."); onClose(); }}>Save changes</Button>
          </>
        }
      >
        {app.subtitle && <p className="-mt-1 mb-4 text-[13px] text-ink-3">{app.subtitle}{href && <> · <Link href={href} className="link" onClick={onClose}>View details</Link></>}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status" htmlFor="am-status">
            <Select id="am-status" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as ApplicationStatus })}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </Select>
          </Field>
          <Field label="Deadline" htmlFor="am-date" hint="Use the date confirmed on the official site.">
            <Input id="am-date" type="date" value={draft.deadline ?? ""} onChange={(e) => setDraft({ ...draft, deadline: e.target.value })} />
          </Field>
          <Field label="Notes" htmlFor="am-notes" className="sm:col-span-2">
            <textarea id="am-notes" rows={3} className="input" value={draft.notes ?? ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Requirements, contacts, essay prompts…" />
          </Field>
        </div>
        <div className="mt-6">
          <p className="mb-2 text-[13px] font-medium text-ink-2">Tasks for this application</p>
          {tasks.length > 0 && <TaskList tasks={tasks} onToggle={(t) => updateTask(t.id, { done: !t.done })} />}
          <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!taskTitle.trim()) return; addTask({ title: taskTitle.trim(), applicationId: app.id }); setTaskTitle(""); }}>
            <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g. Request transcript" aria-label="New task for this application" />
            <Button type="submit" variant="secondary" disabled={!taskTitle.trim()}>Add</Button>
          </form>
        </div>
      </Modal>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        danger
        title="Remove application?"
        message={`“${app.title}” will be removed from your planner. Its tasks will be kept but unlinked.`}
        confirmLabel="Remove"
        onConfirm={() => { removeApplication(app.id); toast.info("Application removed."); onClose(); }}
      />
    </>
  );
}

function NewApplicationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addApplication } = useApp();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("interested");
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (open) { setTitle(""); setSubtitle(""); setDeadline(""); setStatus("interested"); setErr(null); } }, [open]);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a custom application"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => { if (!title.trim()) return setErr("Enter a name for this application."); addApplication({ kind: "custom", title: title.trim(), subtitle: subtitle.trim() || undefined, deadline: deadline || undefined, status }); toast.success("Application added."); onClose(); }}>Add application</Button></>}
    >
      <p className="mb-4 text-[13px] text-ink-3">For anything not in our database. To track a listed university or opportunity, use “Add to planner” on its page.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="na-title" className="sm:col-span-2" error={err ?? undefined}><Input id="na-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Local bank summer internship" /></Field>
        <Field label="Organisation (optional)" htmlFor="na-sub" className="sm:col-span-2"><Input id="na-sub" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} /></Field>
        <Field label="Deadline" htmlFor="na-date"><Input id="na-date" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></Field>
        <Field label="Status" htmlFor="na-status"><Select id="na-status" value={status} onChange={(e) => setStatus(e.target.value as ApplicationStatus)}>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</Select></Field>
      </div>
    </Modal>
  );
}

function TaskModal({ initial, onClose }: { initial: Partial<PlannerTask> | null; onClose: () => void }) {
  const { addTask, data } = useApp();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [appId, setAppId] = useState("");
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (initial) { setTitle(initial.title ?? ""); setDue(initial.due ?? ""); setAppId(initial.applicationId ?? ""); setErr(null); } }, [initial]);
  return (
    <Modal
      open={!!initial}
      onClose={onClose}
      title="New task"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => { if (!title.trim()) return setErr("Enter a task."); addTask({ title: title.trim(), due: due || undefined, applicationId: appId || undefined }); toast.success("Task added."); onClose(); }}>Add task</Button></>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Task" htmlFor="tm-title" className="sm:col-span-2" error={err ?? undefined}><Input id="tm-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Ask teacher for a recommendation" /></Field>
        <Field label="Due date" htmlFor="tm-due"><Input id="tm-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
        <Field label="Linked application" htmlFor="tm-app">
          <Select id="tm-app" value={appId} onChange={(e) => setAppId(e.target.value)}>
            <option value="">None</option>
            {data!.applications.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}
