import type { Metadata } from "next";
import { Suspense } from "react";
import { GuestGate } from "@/components/auth/GuestGate";
import { ProfileEditor } from "@/components/profile/ProfileEditor";

export const metadata: Metadata = { title: "Your profile" };

export default function ProfilePage() {
  return (
    <GuestGate title="Build your student profile" body="One detailed profile powers every match on CareerPath — universities, scholarships, competitions, internships and careers.">
      <Suspense>
        <ProfileEditor />
      </Suspense>
    </GuestGate>
  );
}
