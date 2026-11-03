import { NextResponse } from "next/server";
import { getCourses, searchCourses } from "@/lib/live/courses";

export const maxDuration = 30;

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const all = await getCourses();
  const r = searchCourses(all, {
    q: sp.get("q") ?? undefined,
    domain: sp.get("domain") ?? undefined,
    lang: sp.get("lang") ?? undefined,
    certificate: sp.get("cert") === "1",
    offset: Number(sp.get("offset")) || 0,
    limit: Number(sp.get("limit")) || 48,
  });
  return NextResponse.json(
    { catalogueSize: all.length, ...r },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
