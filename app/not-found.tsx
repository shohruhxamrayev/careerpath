import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="container flex flex-1 flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-md border border-line bg-surface text-ink-3">
        <Compass className="h-6 w-6" />
      </div>
      <p className="eyebrow">Error 404</p>
      <h1 className="display mt-2 text-[36px]">This page isn&apos;t on the map</h1>
      <p className="mt-3 max-w-md text-[15px] text-ink-3">The link may be outdated or mistyped. You can head back home or search for what you were looking for.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <ButtonLink href="/">Back to home</ButtonLink>
        <ButtonLink href="/search" variant="secondary">Search CareerPath</ButtonLink>
      </div>
    </div>
  );
}
