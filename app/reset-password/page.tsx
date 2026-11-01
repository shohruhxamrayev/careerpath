"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button, ButtonLink, Field, Input } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/lib/store/AppProvider";

type Step = "request" | "reset" | "done";

export default function ResetPasswordPage() {
  const { requestReset, resetPassword, mode } = useApp();
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Supabase recovery links land here with type=recovery in the URL hash.
  useEffect(() => {
    if (mode === "supabase" && typeof window !== "undefined" && window.location.hash.includes("type=recovery")) setStep("reset");
  }, [mode]);

  const request = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email address.");
    setLoading(true);
    try {
      const r = await requestReset(email);
      if (mode === "supabase") {
        setInfo("If an account exists for this email, we've sent a link to reset your password.");
      } else if (r.devCode) {
        setDevCode(r.devCode);
        setStep("reset");
      } else {
        setInfo("If an account exists for this email, a reset code has been issued.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) return setError("The passwords don't match.");
    setLoading(true);
    try {
      await resetPassword({ email, code, password });
      setStep("done");
      toast.success("Password updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "done") {
    return (
      <AuthShell title="Password updated">
        <div className="flex items-start gap-3 rounded border border-ok/20 bg-ok-bg p-4 text-[14px] text-ok">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> You can now log in with your new password.
        </div>
        <Button className="mt-6 w-full" size="lg" onClick={() => router.push("/login")}>Go to log in</Button>
      </AuthShell>
    );
  }

  if (step === "reset") {
    return (
      <AuthShell title="Choose a new password" subtitle={mode === "local" ? `Resetting the password for ${email}` : undefined}>
        {devCode && (
          <div className="mb-5 rounded border border-info/20 bg-info-bg px-3 py-2.5 text-[13px] text-info">
            <span className="font-medium">Local mode:</span> email delivery isn&apos;t configured, so your one-time code is shown here: <span className="font-mono font-semibold tracking-wider">{devCode}</span>
          </div>
        )}
        <form onSubmit={reset} className="space-y-4" noValidate>
          {mode === "local" && (
            <Field label="Reset code" htmlFor="code">
              <Input id="code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} />
            </Field>
          )}
          <Field label="New password" htmlFor="pw" hint="At least 8 characters, with a letter and a number.">
            <Input id="pw" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Field label="Confirm new password" htmlFor="pw2">
            <Input id="pw2" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>
          {error && <p role="alert" className="rounded border border-bad/20 bg-bad-bg px-3 py-2 text-[13px] text-bad">{error}</p>}
          <Button type="submit" className="w-full" size="lg" loading={loading}>Update password</Button>
          <button type="button" onClick={() => { setStep("request"); setDevCode(null); setError(null); }} className="w-full text-center text-[13px] text-ink-3 hover:text-ink">
            Use a different email
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Reset your password" subtitle={<>Remembered it? <Link href="/login" className="link">Log in</Link></>}>
      <form onSubmit={request} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        {error && <p role="alert" className="rounded border border-bad/20 bg-bad-bg px-3 py-2 text-[13px] text-bad">{error}</p>}
        {info && <p role="status" className="rounded border border-info/20 bg-info-bg px-3 py-2 text-[13px] text-info">{info}</p>}
        <Button type="submit" className="w-full" size="lg" loading={loading}>Send reset instructions</Button>
        <ButtonLink href="/signup" variant="ghost" className="w-full">Create a new account instead</ButtonLink>
      </form>
    </AuthShell>
  );
}
