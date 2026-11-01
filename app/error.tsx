"use client";

import { RefreshCw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container flex flex-1 flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="display mt-2 text-[34px]">We couldn&apos;t load this page</h1>
      <p className="mt-3 max-w-md text-[15px] text-ink-3">This is on our side, not yours. Your saved data is safe. Try again, or go back to the home page.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>
          <RefreshCw className="h-4 w-4" /> Try again
        </Button>
        <ButtonLink href="/" variant="secondary">Back to home</ButtonLink>
      </div>
    </div>
  );
}
