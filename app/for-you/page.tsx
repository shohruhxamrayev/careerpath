import type { Metadata } from "next";
import { GuestGate } from "@/components/auth/GuestGate";
import { ForYouDashboard } from "@/components/ForYouDashboard";

export const metadata: Metadata = { title: "For You" };

export default function ForYouPage() {
  return (
    <GuestGate title="Your personalised recommendations" body="Create a profile and CareerPath will recommend universities, scholarships, competitions, internships, careers and skills — each with the reason why.">
      <ForYouDashboard />
    </GuestGate>
  );
}
