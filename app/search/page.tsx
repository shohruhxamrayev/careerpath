import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchResults } from "@/components/SearchResults";
import { Skeleton } from "@/components/ui";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container py-10"><Skeleton className="h-12 w-full max-w-2xl" /></div>}>
      <SearchResults />
    </Suspense>
  );
}
