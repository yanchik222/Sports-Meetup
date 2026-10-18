"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { signOutAction } from "../../auth/actions";
import { CalendarIcon, SearchIcon, SendIcon, SignOutIcon, SlidersIcon, TrophyIcon } from "./icons";
import { Avatar, Logo } from "./ui";

const NAV_ITEMS = [
  { href: "/availability", label: "Availability", short: "Availability", icon: CalendarIcon },
  { href: "/preferences", label: "Sport preferences", short: "Preferences", icon: SlidersIcon },
  { href: "/players", label: "Find players", short: "Players", icon: SearchIcon },
  { href: "/requests", label: "Play requests", short: "Requests", icon: SendIcon },
  { href: "/matches", label: "Match history", short: "History", icon: TrophyIcon },
];

// Navigation in three sizes: a full sidebar on wide screens, an icon rail on
// medium ones, and a top bar plus bottom tab bar on phones.
export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const name = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email : "";

  const signOut = (
    <form action={signOutAction}>
      <button type="submit" className="btn btn-ghost btn-sm px-2.5" aria-label="Sign out" title="Sign out">
        <SignOutIcon className="size-5" />
      </button>
    </form>
  );

  return (
    <>
      {/* Phones: top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <Link href="/availability" className="rounded-lg focus-visible:ring-3 focus-visible:ring-brand-300 focus-visible:outline-none">
          <Logo />
        </Link>
        {user && signOut}
      </header>

      {/* Phones: bottom tabs */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {NAV_ITEMS.map(({ href, short, icon: NavIcon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="flex flex-col items-center gap-1 py-2 text-[11px] font-medium focus-visible:outline-none"
            >
              <span
                className={`grid h-7 w-12 place-items-center rounded-full transition-colors ${
                  active ? "bg-brand-100 text-brand-900" : "text-slate-500"
                }`}
              >
                <NavIcon className="size-5" weight={active ? "fill" : "regular"} />
              </span>
              <span className={active ? "text-slate-900" : "text-slate-500"}>{short}</span>
            </Link>
          );
        })}
      </nav>

      {/* Tablets and up: sidebar (icons only until the window is wide) */}
      <aside className="sticky top-0 hidden h-dvh shrink-0 flex-col self-start border-r border-slate-200 bg-white md:flex md:w-[4.5rem] lg:w-60">
        <div className="flex h-16 items-center px-4 md:justify-center lg:justify-start lg:px-5">
          <Link
            href="/availability"
            className="rounded-lg focus-visible:ring-3 focus-visible:ring-brand-300 focus-visible:outline-none"
          >
            <Logo collapsible />
          </Link>
        </div>

        <nav aria-label="Main" className="mt-3 flex flex-1 flex-col gap-0.5">
          {NAV_ITEMS.map(({ href, label, icon: NavIcon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={label}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-11 items-center gap-3 text-sm font-medium transition-colors focus-visible:bg-slate-50 focus-visible:outline-none md:justify-center lg:justify-start lg:px-5 ${
                  active
                    ? "bg-brand-100 text-brand-900 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-brand-400"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <NavIcon className="size-5 shrink-0" weight={active ? "fill" : "regular"} />
                <span className="md:max-lg:sr-only">{label}</span>
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="flex items-center gap-3 border-t border-slate-200 p-3 md:flex-col lg:flex-row lg:px-4">
            <Avatar name={name} small />
            <p title={user.email} className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 md:max-lg:hidden">
              {name}
            </p>
            {signOut}
          </div>
        )}
      </aside>
    </>
  );
}
