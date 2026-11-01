"use client";

import { Lock } from "lucide-react";
import { usePathname } from "next/navigation";
import { ButtonLink, Skeleton } from "@/components/ui";
import { useApp } from "@/lib/store/AppProvider";

/** Renders children only for signed-in users; otherwise a clear sign-in prompt (never a dead page). */
export function GuestGate({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  const { ready, user, data } = useApp();
  const path = usePathname();
  if (!ready || (user && !data)) {
    return (
      <div className="container py-10" aria-busy="true">
        <Skeleton className="mb-3 h-3 w-24" />
        <Skeleton className="mb-8 h-9 w-80" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="container flex flex-1 items-center justify-center py-20">
        <div className="card max-w-md p-8 text-center">
          <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-brand-50 text-brand-700">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="display text-[28px]">{title}</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-3">{body}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <ButtonLink href={`/signup?next=${encodeURIComponent(path)}`}>Create your profile</ButtonLink>
            <ButtonLink href={`/login?next=${encodeURIComponent(path)}`} variant="secondary">Log in</ButtonLink>
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
