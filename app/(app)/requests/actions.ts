"use server";

import { revalidatePath } from "next/cache";
import * as db from "@/lib/db";
import type { PlayRequest } from "@/lib/db";
import { currentUserId, oneOf, text } from "@/lib/action-helpers";
import { findConflict, proposerOf, responderOf } from "@/lib/schedule";
import { DURATIONS, formatDate, formatTime, hasArrived, hasPassed, isValidDate } from "@/lib/time";

export type RequestFormState = { error?: string; sent?: boolean };

const MAX_LOCATION_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 300;

type Slot = { date: string; time: string; duration: number; location: string };

// Reads the date, time, length, and location fields, or returns what's wrong.
function readSlot(form: FormData): Slot | string {
  const date = text(form, "date");
  const time = text(form, "time");
  const duration = Number(text(form, "duration"));
  const location = text(form, "location");

  if (!isValidDate(date)) return "Choose a date.";
  if (hasPassed(date)) return "That date has already passed.";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return "Choose a valid time.";
  if (!DURATIONS.includes(duration)) return "Choose how long you want to play.";
  if (location.length > MAX_LOCATION_LENGTH) return `Location must be ${MAX_LOCATION_LENGTH} characters or less.`;
  return { date, time, duration, location };
}

// Explains which upcoming match gets in the way of meeting at this slot.
function conflictMessage(
  requests: PlayRequest[],
  userId: string,
  other: { id: string; name: string },
  slot: Slot,
  ignoreId?: string,
) {
  const conflict = findConflict(requests, [userId, other.id], slot, ignoreId);
  if (!conflict) return undefined;
  if (conflict.fromUserId === userId || conflict.toUserId === userId) {
    return `That overlaps your ${conflict.sport} match on ${formatDate(conflict.date)} at ${formatTime(conflict.time)}.`;
  }
  return `${other.name} already has a match at that time.`;
}

function revalidateRequests() {
  revalidatePath("/requests");
  revalidatePath("/players");
}

export async function sendRequest(_prev: RequestFormState, form: FormData): Promise<RequestFormState> {
  const userId = await currentUserId();
  const toUserId = text(form, "toUserId");
  const sport = oneOf(db.SPORTS, text(form, "sport"));
  const message = text(form, "message");

  const player = toUserId && toUserId !== userId ? await db.getProfile(toUserId) : undefined;
  if (!player) return { error: "That player could not be found." };
  if (!sport || !player.sports.includes(sport)) return { error: `Choose a sport ${player.name} plays.` };
  const slot = readSlot(form);
  if (typeof slot === "string") return { error: slot };
  if (message.length > MAX_MESSAGE_LENGTH) return { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or less.` };

  // Only one pending request at a time between two players (ones for dates
  // that have passed don't count).
  const players = [userId, toUserId];
  const hasPending = (requests: PlayRequest[]) =>
    requests.some(
      (r) =>
        r.status === "pending" &&
        !hasPassed(r.date) &&
        players.includes(r.fromUserId) &&
        players.includes(r.toUserId),
    );

  const requests = await db.getRequests();
  if (hasPending(requests)) return { error: `You already have a pending request with ${player.name}.` };
  const conflict = conflictMessage(requests, userId, player, slot);
  if (conflict) return { error: conflict };

  const created = await db.createRequest(
    { fromUserId: userId, toUserId, sport, message, ...slot },
    (current) => !hasPending(current) && !findConflict(current, players, slot),
  );
  if (!created) return { error: "Something changed while sending. Please try again." };

  revalidateRequests();
  return { sent: true };
}

// Suggests a new time. On a pending request this replaces its time and the
// other player becomes the one who needs to respond. On an accepted match the
// new time waits for the other player to accept it.
export async function proposeNewTime(_prev: RequestFormState, form: FormData): Promise<RequestFormState> {
  const userId = await currentUserId();
  const id = text(form, "id");
  const slot = readSlot(form);
  if (typeof slot === "string") return { error: slot };

  const canChange = (r: PlayRequest) =>
    (r.fromUserId === userId || r.toUserId === userId) && (r.status === "pending" || r.status === "accepted");

  const requests = await db.getRequests();
  const request = requests.find((r) => r.id === id);
  if (!request || !canChange(request)) return { error: "This request can't be changed anymore." };

  const otherId = request.fromUserId === userId ? request.toUserId : request.fromUserId;
  const other = { id: otherId, name: (await db.getProfile(otherId))?.name ?? "The other player" };
  const conflict = conflictMessage(requests, userId, other, slot, id);
  if (conflict) return { error: conflict };

  const changed = await db.updateRequest(
    id,
    (r, current) => canChange(r) && !findConflict(current, [r.fromUserId, r.toUserId], slot, r.id),
    (r) =>
      r.status === "pending"
        ? { ...slot, proposedBy: userId }
        : { reschedule: { ...slot, proposedBy: userId } },
  );
  if (!changed) return { error: "Something changed. Please try again." };

  revalidateRequests();
  return { sent: true };
}

export async function acceptRequest(form: FormData) {
  const userId = await currentUserId();
  await db.updateRequest(
    text(form, "id"),
    (r, requests) =>
      r.status === "pending" &&
      responderOf(r) === userId &&
      !hasPassed(r.date) &&
      !findConflict(requests, [r.fromUserId, r.toUserId], r, r.id),
    { status: "accepted" },
  );
  revalidateRequests();
}

export async function declineRequest(form: FormData) {
  const userId = await currentUserId();
  await db.updateRequest(
    text(form, "id"),
    (r) => r.status === "pending" && responderOf(r) === userId,
    { status: "declined" },
  );
  revalidateRequests();
}

// Whoever suggested a pending request's time can withdraw it, and either
// player can cancel a match that hasn't been played yet.
export async function cancelRequest(form: FormData) {
  const userId = await currentUserId();
  await db.updateRequest(
    text(form, "id"),
    (r) =>
      (r.status === "pending" && proposerOf(r) === userId) ||
      (r.status === "accepted" && (r.fromUserId === userId || r.toUserId === userId)),
    { status: "cancelled", cancelledBy: userId, reschedule: undefined },
  );
  revalidateRequests();
}

// Moves an accepted match to the time the other player suggested.
export async function acceptNewTime(form: FormData) {
  const userId = await currentUserId();
  await db.updateRequest(
    text(form, "id"),
    (r, requests) =>
      r.status === "accepted" &&
      !!r.reschedule &&
      r.reschedule.proposedBy !== userId &&
      (r.fromUserId === userId || r.toUserId === userId) &&
      !hasPassed(r.reschedule.date) &&
      !findConflict(requests, [r.fromUserId, r.toUserId], r.reschedule, r.id),
    (r) => ({
      date: r.reschedule!.date,
      time: r.reschedule!.time,
      duration: r.reschedule!.duration,
      location: r.reschedule!.location,
      reschedule: undefined,
    }),
  );
  revalidateRequests();
}

// Keeps an accepted match at its current time, dropping a suggested new one.
// The player who suggested it can withdraw it the same way.
export async function keepCurrentTime(form: FormData) {
  const userId = await currentUserId();
  await db.updateRequest(
    text(form, "id"),
    (r) => r.status === "accepted" && !!r.reschedule && (r.fromUserId === userId || r.toUserId === userId),
    { reschedule: undefined },
  );
  revalidateRequests();
}

// A match can be marked completed starting on the day it's scheduled.
export async function completeMatch(form: FormData) {
  const userId = await currentUserId();
  await db.updateRequest(
    text(form, "id"),
    (r) => r.status === "accepted" && hasArrived(r.date) && (r.fromUserId === userId || r.toUserId === userId),
    { status: "completed", completedAt: new Date().toISOString(), result: text(form, "result"), reschedule: undefined },
  );
  revalidateRequests();
  revalidatePath("/matches");
}
