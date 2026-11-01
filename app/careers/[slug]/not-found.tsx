import { Briefcase } from "lucide-react";
import { ButtonLink, EmptyState } from "@/components/ui";

export default function CareerNotFound() {
  return (
    <div className="container flex flex-1 items-center justify-center py-20">
      <EmptyState
        icon={<Briefcase />}
        title="Career not found"
        body="We couldn't find this career path."
        action={<><ButtonLink href="/careers">Back to Careers</ButtonLink><ButtonLink href="/search" variant="secondary">Search</ButtonLink></>}
        className="w-full max-w-lg"
      />
    </div>
  );
}
