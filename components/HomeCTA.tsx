"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "@/components/ui";
import { useApp } from "@/lib/store/AppProvider";
import { cn } from "@/lib/utils";

export function HomeCTA({ inverted }: { inverted?: boolean }) {
  const { user } = useApp();
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row", !inverted && "mt-9")}>
      <Link href={user ? "/for-you" : "/signup"} className={cn(buttonClass("primary", "lg"), inverted && "bg-white text-brand-800 hover:bg-brand-50")}>
        {user ? "Go to your recommendations" : "Create your profile"} <ArrowRight className="h-4 w-4" />
      </Link>
      <Link href="/opportunities" className={cn(buttonClass("secondary", "lg"), inverted && "border-white/30 bg-transparent text-white hover:border-white hover:bg-white/10")}>
        Explore opportunities
      </Link>
    </div>
  );
}
