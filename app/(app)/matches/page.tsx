import { withAuth } from "@workos-inc/authkit-nextjs";
import { getProfiles, getRequestsFor } from "@/lib/db";
import { Card } from "../components/Card";

export default async function MatchesPage() {
  const { user } = await withAuth({ ensureSignedIn: true });
  const [requests, profiles] = await Promise.all([getRequestsFor(user.id), getProfiles()]);
  const nameOf = (id: string) => profiles.find((p) => p.id === id)?.name ?? "Unknown player";

  const matches = requests
    .filter((r) => r.status === "completed")
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));

  return (
    <Card title="Match History" description="Your completed matches.">
      {matches.length === 0 ? (
        <p className="text-gray-500">No completed matches yet. Mark an accepted request as completed to see it here.</p>
      ) : (
        <div className="space-y-2">
          {matches.map((m) => (
            <details key={m.id} className="rounded border p-3">
              <summary className="cursor-pointer font-medium">
                {m.sport} with {nameOf(m.fromUserId === user.id ? m.toUserId : m.fromUserId)} · {m.date}
              </summary>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="text-gray-500">Date</dt>
                <dd>
                  {m.date} at {m.time}
                </dd>
                <dt className="text-gray-500">Location</dt>
                <dd>{m.location || "—"}</dd>
                <dt className="text-gray-500">Result</dt>
                <dd>{m.result || "—"}</dd>
                <dt className="text-gray-500">Requested by</dt>
                <dd>{nameOf(m.fromUserId)}</dd>
                {m.message && (
                  <>
                    <dt className="text-gray-500">Message</dt>
                    <dd>{m.message}</dd>
                  </>
                )}
              </dl>
            </details>
          ))}
        </div>
      )}
    </Card>
  );
}
