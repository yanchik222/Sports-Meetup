import { withAuth } from "@workos-inc/authkit-nextjs";
import { getAvailability } from "@/lib/db";
import AvailabilityForm from "./AvailabilityForm";
import { PageShell } from "../components/ui";

export default async function AvailabilityPage() {
  const { user } = await withAuth({ ensureSignedIn: true });
  const availability = await getAvailability(user.id);

  return (
    <PageShell
      title="Availability"
      description="Let other players know when you're free to play."
    >
      <AvailabilityForm availability={availability} />
    </PageShell>
  );
}
