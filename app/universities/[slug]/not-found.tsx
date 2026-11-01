import { GraduationCap } from "lucide-react";
import { ButtonLink, EmptyState } from "@/components/ui";

export default function UniversityNotFound() {
  return (
    <div className="container flex flex-1 items-center justify-center py-20">
      <EmptyState
        icon={<GraduationCap />}
        title="University not found"
        body="We couldn't find this university. It may have been renamed or isn't in our dataset yet."
        action={<><ButtonLink href="/universities">Back to Universities</ButtonLink><ButtonLink href="/search" variant="secondary">Search</ButtonLink></>}
        className="w-full max-w-lg"
      />
    </div>
  );
}
