import type { PlayRequest } from "./db";
import { DEFAULT_DURATION, toMinutes } from "./time";

type Slot = { date: string; time: string; duration?: number };

// Requests made before durations existed count as the default length.
export function durationOf(slot: Slot) {
  return slot.duration ?? DEFAULT_DURATION;
}

// Start and end of a slot in minutes since a fixed point, so matches that run
// past midnight still compare correctly.
function minutesRange(slot: Slot) {
  const [year, month, day] = slot.date.split("-").map(Number);
  const start = Date.UTC(year, month - 1, day) / 60000 + toMinutes(slot.time);
  return [start, start + durationOf(slot)];
}

export function overlaps(a: Slot, b: Slot) {
  const [aStart, aEnd] = minutesRange(a);
  const [bStart, bEnd] = minutesRange(b);
  return aStart < bEnd && bStart < aEnd;
}

// The first accepted match involving any of `players` that overlaps `slot`,
// skipping the request being changed.
export function findConflict(requests: PlayRequest[], players: string[], slot: Slot, ignoreId?: string) {
  return requests.find(
    (r) =>
      r.id !== ignoreId &&
      r.status === "accepted" &&
      (players.includes(r.fromUserId) || players.includes(r.toUserId)) &&
      overlaps(r, slot),
  );
}

// Who suggested the current time of a pending request. The other player is the
// one who needs to accept or decline it.
export function proposerOf(r: PlayRequest) {
  return r.proposedBy ?? r.fromUserId;
}

export function responderOf(r: PlayRequest) {
  return proposerOf(r) === r.fromUserId ? r.toUserId : r.fromUserId;
}
