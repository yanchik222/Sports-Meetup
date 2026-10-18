import Link from "next/link";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { getProfiles, getRequests, type PlayRequest } from "@/lib/db";
import { durationOf, findConflict, proposerOf, responderOf } from "@/lib/schedule";
import { formatDate, formatTime, formatTimeRange, hasArrived, hasPassed } from "@/lib/time";
import {
  acceptNewTime,
  acceptRequest,
  cancelRequest,
  completeMatch,
  declineRequest,
  keepCurrentTime,
} from "./actions";
import ChangeTimeForm from "./ChangeTimeForm";
import { Card } from "../components/Card";

type Slot = { date: string; time: string; duration?: number };

// Soonest first.
const bySchedule = (a: PlayRequest, b: PlayRequest) => (a.date + a.time).localeCompare(b.date + b.time);
// Most recently changed first.
const byLastUpdate = (a: PlayRequest, b: PlayRequest) =>
  (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt);

const when = (slot: Slot) => `${formatDate(slot.date)}, ${formatTimeRange(slot.time, durationOf(slot))}`;
const currentSlot = (r: PlayRequest) => ({ date: r.date, time: r.time, duration: durationOf(r), location: r.location });
// Remounts the change-time form after each change so it closes and resets.
const formKey = (r: PlayRequest) => `${r.id}-${r.updatedAt ?? r.createdAt}`;

export default async function RequestsPage() {
  const { user } = await withAuth({ ensureSignedIn: true });
  const [allRequests, profiles] = await Promise.all([getRequests(), getProfiles()]);
  const requests = allRequests.filter((r) => r.fromUserId === user.id || r.toUserId === user.id);
  const nameOf = (id: string) => profiles.find((p) => p.id === id)?.name ?? "Unknown player";
  const otherPlayer = (r: PlayRequest) => nameOf(r.fromUserId === user.id ? r.toUserId : r.fromUserId);

  // Explains which accepted match gets in the way of playing `r` at `slot`.
  function conflictNote(r: PlayRequest, slot: Slot) {
    const conflict = findConflict(allRequests, [r.fromUserId, r.toUserId], slot, r.id);
    if (!conflict) return undefined;
    return conflict.fromUserId === user.id || conflict.toUserId === user.id
      ? `Overlaps your ${conflict.sport} match with ${otherPlayer(conflict)} at ${formatTime(conflict.time)}.`
      : `${otherPlayer(r)} already has a match then.`;
  }

  // Shown when the current time came from a suggestion instead of the original request.
  function suggestionNote(r: PlayRequest) {
    if (proposerOf(r) === r.fromUserId) return undefined;
    return proposerOf(r) === user.id ? "You suggested this time." : `${otherPlayer(r)} suggested this time instead.`;
  }

  function closedLabel(r: PlayRequest) {
    if (r.status === "declined") return responderOf(r) === user.id ? "You declined" : `${otherPlayer(r)} declined`;
    if (!r.cancelledBy) return "Cancelled";
    return r.cancelledBy === user.id ? "You cancelled" : `${otherPlayer(r)} cancelled`;
  }

  const incoming = requests.filter((r) => r.status === "pending" && responderOf(r) === user.id).sort(bySchedule);
  const sent = requests.filter((r) => r.status === "pending" && proposerOf(r) === user.id).sort(bySchedule);
  const upcoming = requests.filter((r) => r.status === "accepted").sort(bySchedule);
  const closed = requests.filter((r) => r.status === "declined" || r.status === "cancelled").sort(byLastUpdate);

  return (
    <Card title="Play Requests" description="Send, accept, decline, reschedule, and cancel play requests.">
      <Section title="Incoming" count={incoming.length} empty="No incoming requests.">
        {incoming.map((r) => {
          const passed = hasPassed(r.date);
          const conflict = conflictNote(r, r);
          return (
            <Row
              key={r.id}
              request={r}
              who={`From ${otherPlayer(r)}`}
              note={suggestionNote(r)}
              extra={
                !passed && (
                  <ChangeTimeForm
                    key={formKey(r)}
                    id={r.id}
                    current={currentSlot(r)}
                    label="Suggest another time"
                    submitLabel="Send new time"
                  />
                )
              }
            >
              {passed ? (
                <span className="text-sm text-gray-500">This date has passed.</span>
              ) : conflict ? (
                <span className="text-sm text-amber-700">{conflict}</span>
              ) : (
                <ActionButton action={acceptRequest} id={r.id} label="Accept" primary />
              )}
              <ActionButton action={declineRequest} id={r.id} label="Decline" />
            </Row>
          );
        })}
      </Section>

      <Section
        title="Sent"
        count={sent.length}
        empty={
          <>
            No pending requests you&apos;ve sent.{" "}
            <Link href="/players" className="text-blue-600 underline">
              Find players
            </Link>{" "}
            to send one.
          </>
        }
      >
        {sent.map((r) => {
          const passed = hasPassed(r.date);
          return (
            <Row
              key={r.id}
              request={r}
              who={`To ${otherPlayer(r)}`}
              note={suggestionNote(r)}
              extra={
                !passed && (
                  <ChangeTimeForm
                    key={formKey(r)}
                    id={r.id}
                    current={currentSlot(r)}
                    label="Change time"
                    submitLabel="Update request"
                  />
                )
              }
            >
              <span className="text-sm text-gray-500">
                {passed ? "This date has passed." : `Waiting for ${otherPlayer(r)} to respond.`}
              </span>
              <ActionButton action={cancelRequest} id={r.id} label="Cancel" />
            </Row>
          );
        })}
      </Section>

      <Section title="Upcoming Matches" count={upcoming.length} empty="No accepted requests yet.">
        {upcoming.map((r) => (
          <Row
            key={r.id}
            request={r}
            who={`With ${otherPlayer(r)}`}
            extra={
              <>
                {r.reschedule && rescheduleNotice(r)}
                <ChangeTimeForm
                  key={formKey(r)}
                  id={r.id}
                  current={currentSlot(r)}
                  label="Propose a new time"
                  submitLabel="Send new time"
                />
              </>
            }
          >
            {hasArrived(r.date) ? (
              <form action={completeMatch} className="flex gap-2">
                <input type="hidden" name="id" value={r.id} />
                <input name="result" placeholder="Result (ex: Won 21-15)" className="rounded border p-1 text-sm" />
                <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white">
                  Mark Completed
                </button>
              </form>
            ) : (
              <span className="text-sm text-gray-500">You can mark it completed on match day.</span>
            )}
            <ActionButton action={cancelRequest} id={r.id} label="Cancel" />
          </Row>
        ))}
      </Section>

      <Section title="Declined & Cancelled" count={closed.length} empty="Nothing here.">
        {closed.map((r) => (
          <Row key={r.id} request={r} who={`${r.fromUserId === user.id ? "To" : "From"} ${otherPlayer(r)}`}>
            <span className="text-sm text-gray-500">{closedLabel(r)}</span>
          </Row>
        ))}
      </Section>
    </Card>
  );

  // A new time one player suggested for an accepted match.
  function rescheduleNotice(r: PlayRequest) {
    const proposal = r.reschedule!;
    const mine = proposal.proposedBy === user.id;
    const passed = hasPassed(proposal.date);
    const conflict = conflictNote(r, proposal);
    const place = proposal.location && proposal.location !== r.location ? ` at ${proposal.location}` : "";

    return (
      <div className="mt-2 rounded bg-blue-50 p-3 text-sm text-blue-800">
        <p>
          {mine ? "You asked to move this to " : `${otherPlayer(r)} wants to move this to `}
          {when(proposal)}
          {place}.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {mine ? (
            <ActionButton action={keepCurrentTime} id={r.id} label="Withdraw" />
          ) : (
            <>
              {passed ? (
                <span className="text-gray-500">That date has passed.</span>
              ) : conflict ? (
                <span className="text-amber-700">{conflict}</span>
              ) : (
                <ActionButton action={acceptNewTime} id={r.id} label="Accept new time" primary />
              )}
              <ActionButton action={keepCurrentTime} id={r.id} label="Keep current time" />
            </>
          )}
        </div>
      </div>
    );
  }
}

function Section({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: React.ReactNode;
  children: React.ReactNode[];
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 text-lg font-semibold">
        {title}
        {count > 0 && <span className="ml-2 text-sm font-normal text-gray-500">({count})</span>}
      </h2>
      {children.length === 0 ? <p className="text-gray-500">{empty}</p> : <div className="space-y-2">{children}</div>}
    </section>
  );
}

function Row({
  request: r,
  who,
  note,
  extra,
  children,
}: {
  request: PlayRequest;
  who: string;
  note?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded border p-3">
      <p className="font-medium">
        {r.sport} · {who}
      </p>
      <p className="text-sm text-gray-600">
        {when(r)}
        {r.location && ` · ${r.location}`}
      </p>
      {note && <p className="text-sm text-gray-600">{note}</p>}
      {r.message && <p className="mt-1 text-sm italic">&ldquo;{r.message}&rdquo;</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2">{children}</div>
      {extra}
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
