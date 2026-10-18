import Link from "next/link";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { getProfiles, getRequests, type PlayRequest } from "@/lib/db";
import { durationOf, findConflict, proposerOf, responderOf } from "@/lib/schedule";
import { formatDate, formatShortDate, formatTime, formatTimeRange, hasArrived, hasPassed } from "@/lib/time";
import {
  acceptNewTime,
  acceptRequest,
  cancelRequest,
  completeMatch,
  declineRequest,
  keepCurrentTime,
} from "./actions";
import ChangeTimeForm from "./ChangeTimeForm";
import { ClockIcon } from "../components/icons";
import { Empty, PageShell, Section } from "../components/ui";

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
    <PageShell title="Play requests" description="Send, accept, decline, reschedule, and cancel play requests.">
      <RequestList title="Incoming" count={incoming.length} empty="No incoming requests.">
        {incoming.map((r) => {
          const passed = hasPassed(r.date);
          const conflict = conflictNote(r, r);
          return (
            <Row
              key={r.id}
              request={r}
              who={`From ${otherPlayer(r)}`}
              note={suggestionNote(r)}
              status={
                passed ? (
                  <span className="text-slate-500">This date has passed.</span>
                ) : (
                  conflict && <span className="font-medium text-amber-800">{conflict}</span>
                )
              }
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
              {!passed && !conflict && <ActionButton action={acceptRequest} id={r.id} label="Accept" primary />}
              <ActionButton action={declineRequest} id={r.id} label="Decline" />
            </Row>
          );
        })}
      </RequestList>

      <RequestList
        title="Sent"
        count={sent.length}
        empty={
          <>
            No pending requests you&apos;ve sent.{" "}
            <Link href="/players" className="link">
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
              status={
                <span className="text-slate-500">
                  {passed ? "This date has passed." : `Waiting for ${otherPlayer(r)} to respond.`}
                </span>
              }
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
              <ActionButton action={cancelRequest} id={r.id} label="Cancel" />
            </Row>
          );
        })}
      </RequestList>

      <RequestList title="Upcoming matches" count={upcoming.length} empty="No accepted requests yet.">
        {upcoming.map((r) => (
          <Row
            key={r.id}
            request={r}
            who={`With ${otherPlayer(r)}`}
            status={
              !hasArrived(r.date) && <span className="text-slate-500">You can mark it completed on match day.</span>
            }
            extra={
              <>
                {hasArrived(r.date) && (
                  <form action={completeMatch} className="mb-3 flex flex-wrap gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <input
                      name="result"
                      aria-label="Result"
                      placeholder="Result (ex: Won 21-15)"
                      className="field max-w-60 flex-1 sm:h-9"
                    />
                    <button type="submit" className="btn btn-primary btn-sm">
                      Mark completed
                    </button>
                  </form>
                )}
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
            <ActionButton action={cancelRequest} id={r.id} label="Cancel" />
          </Row>
        ))}
      </RequestList>

      <RequestList title="Declined & cancelled" count={closed.length} empty="Nothing here.">
        {closed.map((r) => (
          <Row key={r.id} request={r} who={`${r.fromUserId === user.id ? "To" : "From"} ${otherPlayer(r)}`} muted>
            <span className="chip">{closedLabel(r)}</span>
          </Row>
        ))}
      </RequestList>
    </PageShell>
  );

  // A new time one player suggested for an accepted match.
  function rescheduleNotice(r: PlayRequest) {
    const proposal = r.reschedule!;
    const mine = proposal.proposedBy === user.id;
    const passed = hasPassed(proposal.date);
    const conflict = conflictNote(r, proposal);
    const place = proposal.location && proposal.location !== r.location ? ` at ${proposal.location}` : "";

    return (
      <div className="mb-3 rounded-lg bg-brand-50 px-3.5 py-3 text-sm text-brand-900">
        <p>
          {mine ? "You asked to move this to " : `${otherPlayer(r)} wants to move this to `}
          <span className="font-semibold">{when(proposal)}</span>
          {place}.
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {mine ? (
            <ActionButton action={keepCurrentTime} id={r.id} label="Withdraw" />
          ) : (
            <>
              {passed ? (
                <span className="text-slate-500">That date has passed.</span>
              ) : conflict ? (
                <span className="font-medium text-amber-800">{conflict}</span>
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

function RequestList({
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
    <Section title={title} count={count}>
      {children.length === 0 ? <Empty>{empty}</Empty> : <ul className="-my-4 divide-y divide-slate-100">{children}</ul>}
    </Section>
  );
}

// One request: date and time, then the details, then actions. The three
// columns stack when the page is narrow.
function Row({
  request: r,
  who,
  note,
  status,
  extra,
  muted,
  children,
}: {
  request: PlayRequest;
  who: string;
  note?: string;
  status?: React.ReactNode;
  extra?: React.ReactNode;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className={`py-4 ${muted ? "opacity-70" : ""}`}>
      <div className="grid gap-x-6 gap-y-3 @2xl:grid-cols-[10.5rem_1fr_auto]">
        <div>
          <p className="font-semibold text-slate-900">{formatShortDate(r.date)}</p>
          <p className="mt-0.5 flex items-center gap-1 text-sm whitespace-nowrap text-slate-500 tabular-nums">
            <ClockIcon className="size-4 shrink-0" />
            {formatTimeRange(r.time, durationOf(r))}
          </p>
        </div>

        <div className="min-w-0 space-y-1 text-sm">
          <p className="font-semibold text-slate-900">{r.sport}</p>
          <p className="text-slate-600">
            {who}
            {r.location && ` · ${r.location}`}
          </p>
          {note && <p className="text-slate-600">{note}</p>}
          {r.message && <p className="text-slate-600 italic">&ldquo;{r.message}&rdquo;</p>}
          {status && <p>{status}</p>}
        </div>

        <div className="flex flex-wrap items-start gap-2 @2xl:justify-end">{children}</div>
      </div>
      {extra && <div className="mt-3 @2xl:pl-[12rem]">{extra}</div>}
    </li>
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
      <button type="submit" className={`btn btn-sm ${primary ? "btn-primary" : "btn-secondary"}`}>
        {label}
      </button>
    </form>
  );
}
