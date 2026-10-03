import { withAuth } from "@workos-inc/authkit-nextjs";
import { getProfiles, getRequestsFor, type PlayRequest } from "@/lib/db";
import { acceptRequest, cancelRequest, completeMatch, declineRequest } from "./actions";
import { Card } from "../components/Card";

export default async function RequestsPage() {
  const { user } = await withAuth({ ensureSignedIn: true });
  const [requests, profiles] = await Promise.all([getRequestsFor(user.id), getProfiles()]);
  const nameOf = (id: string) => profiles.find((p) => p.id === id)?.name ?? "Unknown player";
  const otherPlayer = (r: PlayRequest) => nameOf(r.fromUserId === user.id ? r.toUserId : r.fromUserId);

  const incoming = requests.filter((r) => r.status === "pending" && r.toUserId === user.id);
  const sent = requests.filter((r) => r.status === "pending" && r.fromUserId === user.id);
  const upcoming = requests.filter((r) => r.status === "accepted");
  const closed = requests.filter((r) => r.status === "declined" || r.status === "cancelled");

  return (
    <Card title="Play Requests" description="Send, accept, decline, and cancel play requests.">
      <Section title="Incoming" empty="No incoming requests.">
        {incoming.map((r) => (
          <Row key={r.id} request={r} who={`From ${otherPlayer(r)}`}>
            <ActionButton action={acceptRequest} id={r.id} label="Accept" primary />
            <ActionButton action={declineRequest} id={r.id} label="Decline" />
          </Row>
        ))}
      </Section>

      <Section title="Sent" empty="No pending requests you've sent.">
        {sent.map((r) => (
          <Row key={r.id} request={r} who={`To ${otherPlayer(r)}`}>
            <ActionButton action={cancelRequest} id={r.id} label="Cancel" />
          </Row>
        ))}
      </Section>

      <Section title="Upcoming Matches" empty="No accepted requests yet.">
        {upcoming.map((r) => (
          <Row key={r.id} request={r} who={`With ${otherPlayer(r)}`}>
            <form action={completeMatch} className="flex gap-2">
              <input type="hidden" name="id" value={r.id} />
              <input name="result" placeholder="Result (ex: Won 21-15)" className="rounded border p-1 text-sm" />
              <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white">
                Mark Completed
              </button>
            </form>
            <ActionButton action={cancelRequest} id={r.id} label="Cancel" />
          </Row>
        ))}
      </Section>

      <Section title="Declined & Cancelled" empty="Nothing here.">
        {closed.map((r) => (
          <Row key={r.id} request={r} who={`${r.fromUserId === user.id ? "To" : "From"} ${otherPlayer(r)}`}>
            <span className="text-sm capitalize text-gray-500">{r.status}</span>
          </Row>
        ))}
      </Section>
    </Card>
  );
}

function Section({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] }) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children.length === 0 ? <p className="text-gray-500">{empty}</p> : <div className="space-y-2">{children}</div>}
    </section>
  );
}

function Row({ request: r, who, children }: { request: PlayRequest; who: string; children: React.ReactNode }) {
  return (
    <div className="rounded border p-3">
      <p className="font-medium">
        {r.sport} · {who}
      </p>
      <p className="text-sm text-gray-600">
        {r.date} at {r.time}
        {r.location && ` · ${r.location}`}
      </p>
      {r.message && <p className="mt-1 text-sm italic">&ldquo;{r.message}&rdquo;</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function ActionButton({
  action,
  id,
  label,
  primary,
}: {
  action: (form: FormData) => Promise<void>;
  id: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className={`rounded px-3 py-1 text-sm font-medium ${primary ? "bg-blue-600 text-white" : "border"}`}
      >
        {label}
      </button>
    </form>
  );
}
