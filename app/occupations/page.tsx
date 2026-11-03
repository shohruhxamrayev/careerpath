import { redirect } from "next/navigation";

export default function OccupationsIndex({ searchParams }: { searchParams: Record<string, string> }) {
  const qs = new URLSearchParams(searchParams).toString();
  redirect(`/careers${qs ? `?${qs}` : ""}`);
}
