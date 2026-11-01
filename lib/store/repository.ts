"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeProfile } from "@/lib/matching/profile";
import type { Application, PlannerTask, SavedItem, StudentProfile } from "@/lib/types";
import { safeJSON } from "@/lib/utils";

export interface UserData {
  profile: StudentProfile;
  saved: SavedItem[];
  applications: Application[];
  tasks: PlannerTask[];
}

export interface Repository {
  load(userId: string, name: string): Promise<UserData>;
  save(userId: string, data: UserData, prev: UserData | null): Promise<void>;
  clear(userId: string): Promise<void>;
}

const key = (id: string) => `cp:data:${id}`;

export const localRepository: Repository = {
  async load(userId, name) {
    const raw = safeJSON<Partial<UserData> | null>(typeof window !== "undefined" ? window.localStorage.getItem(key(userId)) : null, null);
    return {
      profile: normalizeProfile(raw?.profile, name),
      saved: raw?.saved ?? [],
      applications: raw?.applications ?? [],
      tasks: raw?.tasks ?? [],
    };
  },
  async save(userId, data) {
    window.localStorage.setItem(key(userId), JSON.stringify(data));
  },
  async clear(userId) {
    window.localStorage.removeItem(key(userId));
  },
};

/** Supabase-backed repository. Tables and RLS policies are defined in supabase/schema.sql. */
export function supabaseRepository(sb: SupabaseClient): Repository {
  return {
    async load(userId, name) {
      const [p, s, a, t] = await Promise.all([
        sb.from("student_profiles").select("data").eq("user_id", userId).maybeSingle(),
        sb.from("saved_items").select("*").eq("user_id", userId),
        sb.from("applications").select("*").eq("user_id", userId),
        sb.from("planner_tasks").select("*").eq("user_id", userId),
      ]);
      const err = p.error || s.error || a.error || t.error;
      if (err) throw err;
      return {
        profile: normalizeProfile(p.data?.data as Partial<StudentProfile> | undefined, name),
        saved: (s.data ?? []).map((r) => ({ id: r.id, kind: r.kind, slug: r.slug, savedAt: r.saved_at })),
        applications: (a.data ?? []).map((r) => ({
          id: r.id, kind: r.kind, slug: r.slug ?? undefined, title: r.title, subtitle: r.subtitle ?? undefined, status: r.status,
          deadline: r.deadline ?? undefined, notes: r.notes ?? undefined, createdAt: r.created_at, updatedAt: r.updated_at,
        })),
        tasks: (t.data ?? []).map((r) => ({
          id: r.id, title: r.title, due: r.due ?? undefined, done: r.done, applicationId: r.application_id ?? undefined, createdAt: r.created_at,
        })),
      };
    },
    async save(userId, data, prev) {
      const ops: PromiseLike<{ error: unknown }>[] = [];
      if (!prev || prev.profile !== data.profile) {
        ops.push(sb.from("student_profiles").upsert({ user_id: userId, data: data.profile, updated_at: new Date().toISOString() }));
      }
      const sync = <T extends { id: string }>(table: string, cur: T[], old: T[] | undefined, toRow: (x: T) => Record<string, unknown>) => {
        if (old === cur) return;
        const changed = cur.filter((x) => !old?.some((o) => o === x));
        if (changed.length) ops.push(sb.from(table).upsert(changed.map((x) => ({ ...toRow(x), user_id: userId }))));
        const removed = (old ?? []).filter((o) => !cur.some((x) => x.id === o.id)).map((o) => o.id);
        if (removed.length) ops.push(sb.from(table).delete().in("id", removed));
      };
      sync("saved_items", data.saved, prev?.saved, (x) => ({ id: x.id, kind: x.kind, slug: x.slug, saved_at: x.savedAt }));
      sync("applications", data.applications, prev?.applications, (x) => ({
        id: x.id, kind: x.kind, slug: x.slug ?? null, title: x.title, subtitle: x.subtitle ?? null, status: x.status,
        deadline: x.deadline ?? null, notes: x.notes ?? null, created_at: x.createdAt, updated_at: x.updatedAt,
      }));
      sync("planner_tasks", data.tasks, prev?.tasks, (x) => ({
        id: x.id, title: x.title, due: x.due ?? null, done: x.done, application_id: x.applicationId ?? null, created_at: x.createdAt,
      }));
      const results = await Promise.all(ops);
      const failed = results.find((r) => r.error);
      if (failed) throw failed.error;
    },
    async clear(userId) {
      await Promise.all(["saved_items", "applications", "planner_tasks", "student_profiles"].map((t) => sb.from(t).delete().eq("user_id", userId)));
    },
  };
}
