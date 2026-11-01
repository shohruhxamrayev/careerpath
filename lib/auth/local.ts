"use client";

import type { UserAccount } from "@/lib/types";
import { safeJSON, uid } from "@/lib/utils";

/*
 * Development auth fallback.
 * Used when Supabase environment variables are not configured. Accounts live in this browser's
 * localStorage; passwords are stored as salted PBKDF2 hashes, never in plain text. This makes the
 * whole app testable locally while the Supabase adapter handles production auth.
 */

interface StoredUser extends UserAccount {
  salt: string;
  hash: string;
}

const USERS_KEY = "cp:users";
const SESSION_KEY = "cp:session";
const RESET_KEY = "cp:reset";

export class AuthError extends Error {}

function store(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function readUsers(): StoredUser[] {
  return safeJSON<StoredUser[]>(store()?.getItem(USERS_KEY) ?? null, []);
}
function writeUsers(users: StoredUser[]) {
  store()?.setItem(USERS_KEY, JSON.stringify(users));
}

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const subtle = typeof crypto !== "undefined" ? crypto.subtle : undefined;
  if (subtle) {
    const key = await subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await subtle.deriveBits({ name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 120_000, hash: "SHA-256" }, key, 256);
    return toHex(bits);
  }
  // Non-secure contexts (plain http on a LAN address) lack SubtleCrypto. Fall back to a simple hash.
  let h = 2166136261;
  for (const ch of salt + password) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return `fnv-${(h >>> 0).toString(16)}`;
}

const normalizeEmail = (e: string) => e.trim().toLowerCase();
const publicUser = ({ salt: _s, hash: _h, ...u }: StoredUser): UserAccount => u;

export function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Use at least 8 characters.";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Include at least one letter and one number.";
  return null;
}

export const localAuth = {
  getSession(): UserAccount | null {
    const id = store()?.getItem(SESSION_KEY);
    if (!id) return null;
    const u = readUsers().find((x) => x.id === id);
    return u ? publicUser(u) : null;
  },

  async signUp(name: string, email: string, password: string): Promise<UserAccount> {
    const users = readUsers();
    const e = normalizeEmail(email);
    if (users.some((u) => u.email === e)) throw new AuthError("An account with this email already exists. Try logging in.");
    const pwErr = validatePassword(password);
    if (pwErr) throw new AuthError(pwErr);
    const salt = uid();
    const user: StoredUser = { id: uid(), email: e, name: name.trim(), createdAt: new Date().toISOString(), salt, hash: await hashPassword(password, salt) };
    writeUsers([...users, user]);
    store()?.setItem(SESSION_KEY, user.id);
    return publicUser(user);
  },

  async signIn(email: string, password: string): Promise<UserAccount> {
    const u = readUsers().find((x) => x.email === normalizeEmail(email));
    if (!u || (await hashPassword(password, u.salt)) !== u.hash) throw new AuthError("Email or password is incorrect.");
    store()?.setItem(SESSION_KEY, u.id);
    return publicUser(u);
  },

  signOut() {
    store()?.removeItem(SESSION_KEY);
  },

  /** Returns a one-time reset code. In production this would be emailed; locally it is shown on screen. */
  requestReset(email: string): string | null {
    const u = readUsers().find((x) => x.email === normalizeEmail(email));
    if (!u) return null;
    const code = String(Math.floor(100000 + Math.random() * 900000));
    store()?.setItem(RESET_KEY, JSON.stringify({ email: u.email, code, exp: Date.now() + 15 * 60_000 }));
    return code;
  },

  async resetPassword(email: string, code: string, password: string) {
    const r = safeJSON<{ email: string; code: string; exp: number } | null>(store()?.getItem(RESET_KEY) ?? null, null);
    if (!r || r.email !== normalizeEmail(email) || r.code !== code.trim() || Date.now() > r.exp) {
      throw new AuthError("This reset code is invalid or has expired. Request a new one.");
    }
    const pwErr = validatePassword(password);
    if (pwErr) throw new AuthError(pwErr);
    const users = readUsers();
    const u = users.find((x) => x.email === r.email)!;
    u.salt = uid();
    u.hash = await hashPassword(password, u.salt);
    writeUsers(users);
    store()?.removeItem(RESET_KEY);
  },

  updateName(id: string, name: string) {
    const users = readUsers();
    const u = users.find((x) => x.id === id);
    if (u) {
      u.name = name;
      writeUsers(users);
    }
  },

  deleteAccount(id: string) {
    writeUsers(readUsers().filter((u) => u.id !== id));
    store()?.removeItem(SESSION_KEY);
  },
};
