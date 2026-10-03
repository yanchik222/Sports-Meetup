import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

export default async function Landing() {
  const { user } = await withAuth();
  if (user) redirect("/availability");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-gray-100 text-black">
      <h1 className="text-4xl font-bold">Sports Meetup</h1>
      <div className="flex gap-3">
        <a href="/sign-in" className="rounded bg-blue-600 px-4 py-2 font-medium text-white">
          Sign in
        </a>
        <a href="/sign-up" className="rounded border bg-white px-4 py-2 font-medium">
          Sign up
        </a>
      </div>
    </main>
  );
}
