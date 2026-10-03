"use server";

import { revalidatePath } from "next/cache";
import * as db from "@/lib/db";
import { currentUserId, oneOf } from "@/lib/action-helpers";

export async function addAvailability(entry: { day: string; startTime: string; endTime: string }) {
  const userId = await currentUserId();
  const day = oneOf(db.DAYS, entry.day);
  const startTime = entry.startTime.trim();
  const endTime = entry.endTime.trim();
  if (!day || !startTime || !endTime) return;
  await db.addAvailability({ userId, day, startTime, endTime });
  revalidatePath("/availability");
}

export async function removeAvailability(id: string) {
  const userId = await currentUserId();
  await db.removeAvailability(userId, id);
  revalidatePath("/availability");
}
