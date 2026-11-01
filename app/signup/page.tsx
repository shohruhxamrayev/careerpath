"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthShell, DevAuthNotice } from "@/components/auth/AuthShell";
import { Button, Field, Input } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/lib/store/AppProvider";

function SignupForm() {
  const { signUp, user, ready, mode } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const next = params.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;

  useEffect(() => {
    if (ready && user && !loading) router.replace(safeNext ?? "/for-you");
  }, [ready, user, loading, router, safeNext]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Please enter your name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email address.");
    setLoading(true);
    try {
      await signUp(name, email, password);
      toast.success("Account created. Let's build your profile.");
      router.push(safeNext ?? "/profile?onboarding=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle={<>Already have one? <Link href={`/login${safeNext ? `?next=${encodeURIComponent(safeNext)}` : ""}`} className="link">Log in</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Full name" htmlFor="name">
          <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 8 characters, with a letter and a number.">
          <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </Field>
        {error && <p role="alert" className="rounded border border-bad/20 bg-bad-bg px-3 py-2 text-[13px] text-bad">{error}</p>}
        <Button type="submit" className="w-full" size="lg" loading={loading}>Create account</Button>
        <p className="text-center text-[12px] text-ink-3">By creating an account you agree to use CareerPath for personal planning. Your profile is private to you.</p>
      </form>
      {mode === "local" && <DevAuthNotice />}
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
