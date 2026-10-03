import { withAuth } from "@workos-inc/authkit-nextjs";
import { upsertUser } from "@/lib/db";
import { Sidebar } from "./components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Make sure every signed-in user has a profile other players can find.
  const { user } = await withAuth({ ensureSignedIn: true });
  await upsertUser(user);

  return (
    <div className="flex flex-1 flex-col bg-gray-100 md:flex-row">
      <Sidebar />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
