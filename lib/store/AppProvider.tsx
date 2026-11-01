"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AuthError, localAuth, validatePassword } from "@/lib/auth/local";
import { getSupabase, isSupabaseConfigured } from "@/lib/auth/supabase";
import type { Application, ApplicationStatus, ItemKind, PlannerTask, StudentProfile, UserAccount } from "@/lib/types";
import { uid } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { localRepository, supabaseRepository, type Repository, type UserData } from "./repository";

type Mode = "local" | "supabase";

interface AppState {
  ready: boolean;
  mode: Mode;
  user: UserAccount | null;
  data: UserData | null;
  signUp(name: string, email: string, password: string): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  requestReset(email: string): Promise<{ devCode?: string }>;
  resetPassword(args: { email?: string; code?: string; password: string }): Promise<void>;
  deleteAccount(): Promise<void>;
  updateProfile(p: StudentProfile): void;
  isSaved(kind: ItemKind, slug: string): boolean;
  toggleSave(kind: ItemKind, slug: string): boolean;
  findApplication(kind: "university" | "opportunity", slug: string): Application | undefined;
  addApplication(a: Omit<Application, "id" | "createdAt" | "updatedAt" | "status"> & { status?: ApplicationStatus }): Application;
  updateApplication(id: string, patch: Partial<Application>): void;
  removeApplication(id: string): void;
  addTask(t: Omit<PlannerTask, "id" | "createdAt" | "done">): void;
  updateTask(id: string, patch: Partial<PlannerTask>): void;
  removeTask(id: string): void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const mode: Mode = isSupabaseConfigured() ? "supabase" : "local";
  const repo: Repository = useMemo(() => {
    const sb = getSupabase();
    return sb ? supabaseRepository(sb) : localRepository;
  }, []);

  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<UserAccount | null>(null);
  const [data, setData] = useState<UserData | null>(null);
  const lastSaved = useRef<UserData | null>(null);
  const loadedFor = useRef<string | null>(null);

  const loadUser = useCallback(
    async (u: UserAccount | null) => {
      setUser(u);
      if (!u) {
        setData(null);
        lastSaved.current = null;
        loadedFor.current = null;
        return;
      }
      try {
        const d = await repo.load(u.id, u.name);
        lastSaved.current = d;
        loadedFor.current = u.id;
        setData(d);
      } catch {
        toast.error("We couldn't load your saved data. Please refresh the page.");
        const empty = await localRepository.load("__empty__", u.name);
        lastSaved.current = empty;
        loadedFor.current = u.id;
        setData(empty);
      }
    },
    [repo, toast],
  );

  // ── Initial session ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (mode === "supabase") {
        const sb = getSupabase()!;
        const { data: s } = await sb.auth.getSession();
        const su = s.session?.user;
        if (!cancelled) await loadUser(su ? { id: su.id, email: su.email ?? "", name: (su.user_metadata?.name as string) ?? "", createdAt: su.created_at } : null);
        sb.auth.onAuthStateChange((_e, session) => {
          const nu = session?.user;
          if (!nu) return void loadUser(null);
          if (loadedFor.current !== nu.id) void loadUser({ id: nu.id, email: nu.email ?? "", name: (nu.user_metadata?.name as string) ?? "", createdAt: nu.created_at });
        });
      } else {
        if (!cancelled) await loadUser(localAuth.getSession());
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, loadUser]);

  // ── Persist on change ──
  useEffect(() => {
    if (!user || !data || data === lastSaved.current || loadedFor.current !== user.id) return;
    const prev = lastSaved.current;
    lastSaved.current = data;
    // Save immediately so nothing is lost if the student navigates away or closes the tab.
    repo.save(user.id, data, prev).catch(() => toast.error("Your latest change couldn't be saved. Check your connection and try again."));
  }, [data, user, repo, toast]);

  const mutate = useCallback((fn: (d: UserData) => UserData) => setData((d) => (d ? fn(d) : d)), []);

  const api: AppState = useMemo(
    () => ({
      ready,
      mode,
      user,
      data,

      async signUp(name, email, password) {
        if (mode === "supabase") {
          const pwErr = validatePassword(password);
          if (pwErr) throw new AuthError(pwErr);
          const { data: r, error } = await getSupabase()!.auth.signUp({ email, password, options: { data: { name } } });
          if (error) throw new AuthError(error.message);
          if (!r.session) throw new AuthError("Check your email to confirm your account, then log in.");
          return;
        }
        await loadUser(await localAuth.signUp(name, email, password));
      },
      async signIn(email, password) {
        if (mode === "supabase") {
          const { error } = await getSupabase()!.auth.signInWithPassword({ email, password });
          if (error) throw new AuthError("Email or password is incorrect.");
          return;
        }
        await loadUser(await localAuth.signIn(email, password));
      },
      async signOut() {
        if (mode === "supabase") await getSupabase()!.auth.signOut();
        else localAuth.signOut();
        await loadUser(null);
      },
      async requestReset(email) {
        if (mode === "supabase") {
          const { error } = await getSupabase()!.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
          if (error) throw new AuthError("We couldn't send a reset email. Try again in a moment.");
          return {};
        }
        const code = localAuth.requestReset(email);
        return code ? { devCode: code } : {};
      },
      async resetPassword({ email, code, password }) {
        if (mode === "supabase") {
          const pwErr = validatePassword(password);
          if (pwErr) throw new AuthError(pwErr);
          const { error } = await getSupabase()!.auth.updateUser({ password });
          if (error) throw new AuthError("Your reset link has expired. Request a new one.");
          return;
        }
        await localAuth.resetPassword(email ?? "", code ?? "", password);
      },
      async deleteAccount() {
        if (!user) return;
        await repo.clear(user.id);
        if (mode === "local") localAuth.deleteAccount(user.id);
        else await getSupabase()!.auth.signOut();
        await loadUser(null);
      },

      updateProfile(p) {
        mutate((d) => ({ ...d, profile: { ...p, updatedAt: new Date().toISOString() } }));
        if (mode === "local" && user && p.personal.name && p.personal.name !== user.name) {
          localAuth.updateName(user.id, p.personal.name);
          setUser({ ...user, name: p.personal.name });
        }
      },
      isSaved(kind, slug) {
        return !!data?.saved.some((s) => s.kind === kind && s.slug === slug);
      },
      toggleSave(kind, slug) {
        const exists = !!data?.saved.some((s) => s.kind === kind && s.slug === slug);
        mutate((d) => ({
          ...d,
          saved: exists ? d.saved.filter((s) => !(s.kind === kind && s.slug === slug)) : [...d.saved, { id: uid(), kind, slug, savedAt: new Date().toISOString() }],
        }));
        return !exists;
      },
      findApplication(kind, slug) {
        return data?.applications.find((a) => a.kind === kind && a.slug === slug);
      },
      addApplication(a) {
        const now = new Date().toISOString();
        const app: Application = { status: "interested", ...a, id: uid(), createdAt: now, updatedAt: now };
        mutate((d) => ({ ...d, applications: [...d.applications, app] }));
        return app;
      },
      updateApplication(id, patch) {
        mutate((d) => ({ ...d, applications: d.applications.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a)) }));
      },
      removeApplication(id) {
        mutate((d) => ({
          ...d,
          applications: d.applications.filter((a) => a.id !== id),
          tasks: d.tasks.map((t) => (t.applicationId === id ? { ...t, applicationId: undefined } : t)),
        }));
      },
      addTask(t) {
        mutate((d) => ({ ...d, tasks: [...d.tasks, { ...t, id: uid(), done: false, createdAt: new Date().toISOString() }] }));
      },
      updateTask(id, patch) {
        mutate((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
      },
      removeTask(id) {
        mutate((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));
      },
    }),
    [ready, mode, user, data, loadUser, mutate, repo],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside <AppProvider>");
  return v;
}
