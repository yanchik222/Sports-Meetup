import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { ClockIcon } from "./(app)/components/icons";
import { Logo } from "./(app)/components/ui";

export default async function Landing() {
  const { user } = await withAuth();
  if (user) redirect("/availability");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
          <Logo />
          <a href="/sign-in" className="btn btn-secondary btn-sm">
            Sign in
          </a>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-5 py-14 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-20">
        <div>
          <h1 className="font-display text-5xl leading-[1.05] font-bold tracking-tight text-slate-900 md:text-6xl">
            Find your next game<span className="text-brand-400">.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-slate-600">
            Find nearby players at your skill level who are free when you are, then lock in a time to play.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/sign-up" className="btn btn-primary h-11 px-5">
              Create an account
            </a>
            <a href="/sign-in" className="btn btn-secondary h-11 px-5">
              Sign in
            </a>
          </div>
        </div>

        {/* A small copy of an incoming request, styled like the real Play requests page. */}
        <section
          aria-hidden="true"
          className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_48px_-28px_rgb(15_23_42/0.3)] sm:p-6"
        >
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">Incoming</h2>
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-900">1</span>
          </div>
          <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-[8rem_1fr]">
            <div>
              <p className="font-semibold text-slate-900">Sat, Oct 24</p>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                <ClockIcon className="size-4" />
                10:00 AM - 11:30 AM
              </p>
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-slate-900">Tennis</p>
              <p className="text-slate-600">From Priya Natarajan</p>
              <p className="text-slate-600 italic">&ldquo;Rally for a bit, then play a set?&rdquo;</p>
              <div className="flex gap-2 pt-2">
                <span className="btn btn-primary btn-sm">Accept</span>
                <span className="btn btn-secondary btn-sm">Decline</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
