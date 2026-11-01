import type { Metadata } from "next";
import { RoadmapBuilder } from "@/components/roadmap/RoadmapBuilder";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "A month-by-month plan from today to your first day at university — tests, essays, university and scholarship deadlines.",
};

export default function RoadmapPage() {
  return <RoadmapBuilder />;
}
