import type { Metadata } from "next";
import { Suspense } from "react";
import { GuestGate } from "@/components/auth/GuestGate";
import { Planner } from "@/components/planner/Planner";

export const metadata: Metadata = { title: "Planner" };

export default function PlannerPage() {
  return (
    <GuestGate title="Plan every application in one place" body="Save universities and opportunities, track application status, add deadlines and tasks, and see what's due next.">
      <Suspense>
        <Planner />
      </Suspense>
    </GuestGate>
  );
}
