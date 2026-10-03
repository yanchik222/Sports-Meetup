import { withAuth } from "@workos-inc/authkit-nextjs";
import { getAvailability } from "@/lib/db";
import AvailabilityForm from "./AvailabilityForm";

export default async function AvailabilityPage() {
  const { user } = await withAuth({ ensureSignedIn: true });
  const availability = await getAvailability(user.id);

  return <AvailabilityForm availability={availability} />;
}
