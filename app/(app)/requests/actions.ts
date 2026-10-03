"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as db from "@/lib/db";
import { currentUserId, oneOf, text } from "@/lib/action-helpers";

export async function sendRequest(form: FormData) {
  const userId = await currentUserId();
  const toUserId = text(form, "toUserId");
  const sport = oneOf(db.SPORTS, text(form, "sport"));
  const date = text(form, "date");
  const time = text(form, "time");
  if (!toUserId || toUserId === userId || !sport || !date || !time) return;
  if (!(await db.getProfile(toUserId))) return;

  await db.createRequest({
    fromUserId: userId,
    toUserId,
    sport,
    date,
    time,
    location: text(form, "location"),
    message: text(form, "message"),
  });
  revalidatePath("/requests");
  redirect("/requests");
}

export async function acceptRequest(form: FormData) {
  const userId = await currentUserId();
  await db.updateRequest(
    text(form, "id"),
    (r) => r.toUserId === userId && r.status === "pending",
    { status: "accepted" },
  );
  revalidatePath("/requests");
}

export async function declineRequest(form: FormData) {
  const userId = await currentUserId();
  await db.updateRequest(
    text(form, "id"),
    (r) => r.toUserId === userId && r.status === "pending",
    { status: "declined" },
  );
  revalidatePath("/requests");
}

// Either player can cancel a request that hasn't been played yet.
export async function cancelRequest(form: FormData) {
  const userId = await currentUserId();
  await db.updateRequest(
    text(form, "id"),
    (r) =>
      (r.status === "pending" && r.fromUserId === userId) ||
      (r.status === "accepted" && (r.fromUserId === userId || r.toUserId === userId)),
    { status: "cancelled" },
  );
  revalidatePath("/requests");
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
