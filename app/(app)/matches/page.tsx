import { withAuth } from "@workos-inc/authkit-nextjs";
import { getProfiles, getRequestsFor } from "@/lib/db";
import { durationOf } from "@/lib/schedule";
import { formatDate, formatTimeRange } from "@/lib/time";
import { ChevronIcon, TrophyIcon } from "../components/icons";
import { Empty, PageShell, Section } from "../components/ui";

export default async function MatchesPage() {
  const { user } = await withAuth({ ensureSignedIn: true });
  const [requests, profiles] = await Promise.all([getRequestsFor(user.id), getProfiles()]);
  const nameOf = (id: string) => profiles.find((p) => p.id === id)?.name ?? "Unknown player";

  const matches = requests
    .filter((r) => r.status === "completed")
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));

  return (
    <PageShell title="Match history" description="Your completed matches.">
      <Section title="Completed matches" count={matches.length}>
        {matches.length === 0 ? (
          <Empty>No completed matches yet. Mark an accepted request as completed to see it here.</Empty>
        ) : (
          <ul className="-my-1 divide-y divide-slate-100">
            {matches.map((m) => (
              <li key={m.id}>
                <details className="group">
                  <summary className="-mx-2 flex cursor-pointer items-center gap-3 rounded-lg px-2 py-3.5 transition-colors hover:bg-slate-50 focus-visible:ring-3 focus-visible:ring-brand-300 focus-visible:outline-none">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-900">
                      <TrophyIcon className="size-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900">
                        {m.sport} with {nameOf(m.fromUserId === user.id ? m.toUserId : m.fromUserId)}
                      </span>
                      <span className="block text-sm text-slate-500">{formatDate(m.date)}</span>
                    </span>
                    {m.result && <span className="chip hidden @md:inline-flex">{m.result}</span>}
                    <ChevronIcon className="size-4 shrink-0 text-slate-400 transition group-open:rotate-90" />
                  </summary>

                  <dl className="grid gap-x-6 gap-y-3 pb-4 pl-12 @md:grid-cols-2 @2xl:grid-cols-4">
                    <Detail
                      label="Date"
                      value={`${formatDate(m.date)}, ${formatTimeRange(m.time, durationOf(m))}`}
                      wide
                    />
                    <Detail label="Location" value={m.location} />
                    <Detail label="Result" value={m.result ?? ""} />
                    <Detail label="Requested by" value={nameOf(m.fromUserId)} />
                    {m.message && <Detail label="Message" value={m.message} wide />}
                  </dl>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </PageShell>
  );
}

function Detail({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "@md:col-span-2" : undefined}>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-900">
        {value || <span className="font-normal text-slate-400">Not set</span>}
      </dd>
    </div>
  );
}
