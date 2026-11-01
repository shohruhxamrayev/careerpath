"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "@/components/ui";
import { useApp } from "@/lib/store/AppProvider";
import { cn } from "@/lib/utils";

export function HomeCTA({ className }: { className?: string }) {
  const { user } = useApp();
  return (
    <div className={cn("mt-9 flex flex-col gap-3 sm:flex-row", className)}>
      <Link href={user ? "/for-you" : "/signup"} className={buttonClass("mint", "lg", "group")}>
        {user ? "Go to your recommendations" : "Create your profile"} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
      <Link href="/opportunities" className={buttonClass("nightOutline", "lg")}>
        Explore opportunities
      </Link>
    </div>
  );
}
