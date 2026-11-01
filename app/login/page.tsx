"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthShell, DevAuthNotice } from "@/components/auth/AuthShell";
import { Button, Field, Input } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/lib/store/AppProvider";

function LoginForm() {
  const { signIn, user, ready, mode } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const next = params.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/for-you";

  useEffect(() => {
    if (ready && user) router.replace(safeNext);
  }, [ready, user, router, safeNext]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) return setError("Enter your email and password.");
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success("Welcome back.");
      router.push(safeNext);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Log in" subtitle={<>New to CareerPath? <Link href={`/signup${next ? `?next=${encodeURIComponent(safeNext)}` : ""}`} className="link">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-[13px] font-medium text-ink-2">Password</label>
            <Link href="/reset-password" className="text-[12.5px] text-brand-600 hover:underline">Forgot password?</Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p role="alert" className="rounded border border-bad/20 bg-bad-bg px-3 py-2 text-[13px] text-bad">{error}</p>}
        <Button type="submit" className="w-full" size="lg" loading={loading}>Log in</Button>
      </form>
      {mode === "local" && <DevAuthNotice />}
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
