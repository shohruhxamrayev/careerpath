import { Compass } from "lucide-react";
import { ButtonLink, EmptyState } from "@/components/ui";

export default function OpportunityNotFound() {
  return (
    <div className="container flex flex-1 items-center justify-center py-20">
      <EmptyState
        icon={<Compass />}
        title="Opportunity not found"
        body="This opportunity may have closed or isn't in our dataset yet."
        action={<><ButtonLink href="/opportunities">Back to Opportunities</ButtonLink><ButtonLink href="/search" variant="secondary">Search</ButtonLink></>}
        className="w-full max-w-lg"
      />
    </div>
  );
}
