import { withAuth } from "@workos-inc/authkit-nextjs";
import { upsertUser } from "@/lib/db";
import { Sidebar } from "./components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Make sure every signed-in user has a profile other players can find.
  const { user } = await withAuth({ ensureSignedIn: true });
  await upsertUser(user);

  return (
    <div className="flex min-h-dvh flex-1 flex-col md:flex-row">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
