"use server";

import { revalidatePath } from "next/cache";
import * as db from "@/lib/db";
import { currentUserId, oneOf, text } from "@/lib/action-helpers";
import { hasPassed, isValidDate } from "@/lib/time";

export type SendRequestState = { error?: string; sent?: boolean };

const MAX_LOCATION_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 300;

export async function sendRequest(_prev: SendRequestState, form: FormData): Promise<SendRequestState> {
  const userId = await currentUserId();
  const toUserId = text(form, "toUserId");
  const sport = oneOf(db.SPORTS, text(form, "sport"));
  const date = text(form, "date");
  const time = text(form, "time");
  const location = text(form, "location");
  const message = text(form, "message");

  const player = toUserId && toUserId !== userId ? await db.getProfile(toUserId) : undefined;
  if (!player) return { error: "That player could not be found." };
  if (!sport || !player.sports.includes(sport)) return { error: `Choose a sport ${player.name} plays.` };
  if (!isValidDate(date)) return { error: "Choose a date." };
  if (hasPassed(date)) return { error: "That date has already passed." };
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return { error: "Choose a valid time." };
  if (location.length > MAX_LOCATION_LENGTH) return { error: `Location must be ${MAX_LOCATION_LENGTH} characters or less.` };
  if (message.length > MAX_MESSAGE_LENGTH) return { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or less.` };

  const created = await db.createRequest({ fromUserId: userId, toUserId, sport, date, time, location, message });
  if (!created) return { error: `You already have a pending request with ${player.name}.` };

  revalidatePath("/players");
  revalidatePath("/requests");
  return { sent: true };
}

export async function acceptRequest(form: FormData) {
  const userId = await currentUserId();
  await db.updateRequest(
    text(form, "id"),
    (r) => r.toUserId === userId && r.status === "pending" && !hasPassed(r.date),
    { status: "accepted" },
  );
  revalidatePath("/requests");
  revalidatePath("/players");
}

export async function declineRequest(form: FormData) {
  const userId = await currentUserId();
  await db.updateRequest(
    text(form, "id"),
    (r) => r.toUserId === userId && r.status === "pending",
    { status: "declined" },
  );
  revalidatePath("/requests");
  revalidatePath("/players");
}

// Either player can cancel a request that hasn't been played yet.
export async function cancelRequest(form: FormData) {
  const userId = await currentUserId();
  await db.updateRequest(
    text(form, "id"),
    (r) =>
      (r.status === "pending" && r.fromUserId === userId) ||
      (r.status === "accepted" && (r.fromUserId === userId || r.toUserId === userId)),
    { status: "cancelled", cancelledBy: userId },
  );
  revalidatePath("/requests");
  revalidatePath("/players");
}

export async function completeMatch(form: FormData) {
  const userId = await currentUserId();
  await db.updateRequest(
    text(form, "id"),
    (r) => r.status === "accepted" && (r.fromUserId === userId || r.toUserId === userId),
    { status: "completed", completedAt: new Date().toISOString(), result: text(form, "result") },
  );
  revalidatePath("/requests");
  revalidatePath("/matches");
}
