"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { signOutAction } from "../../auth/actions";

const NAV_ITEMS = [
  { href: "/availability", label: "Availability" },
  { href: "/preferences", label: "Sport Preferences" },
  { href: "/players", label: "Find Players" },
  { href: "/requests", label: "Play Requests" },
  { href: "/matches", label: "Match History" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="flex flex-col gap-4 border-b bg-white p-4 text-black md:min-h-screen md:w-60 md:border-r md:border-b-0">
      <Link href="/availability" className="text-xl font-bold">
        Sports Meetup
      </Link>

      <nav className="flex gap-1 overflow-x-auto md:flex-1 md:flex-col">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded px-3 py-2 font-medium ${
                active ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="flex items-center justify-between gap-2 border-t pt-4 md:flex-col md:items-start">
          <span className="truncate text-sm text-gray-600">{user.firstName ?? user.email}</span>
          <form action={signOutAction}>
            <button type="submit" className="rounded border px-3 py-1 text-sm font-medium">
              Sign out
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
