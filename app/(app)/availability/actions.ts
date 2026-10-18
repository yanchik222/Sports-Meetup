"use server";

import { revalidatePath } from "next/cache";
import * as db from "@/lib/db";
import { currentUserId, oneOf } from "@/lib/action-helpers";

// Returns an error message instead of throwing so the form can show it
// (Next.js hides thrown error messages in production).
export async function addAvailability(entry: {
  day: string;
  startTime: string;
  endTime: string;
}): Promise<{ error?: string }> {
  const userId = await currentUserId();

  const day = oneOf(db.DAYS, entry.day);
  const startTime = entry.startTime.trim();
  const endTime = entry.endTime.trim();

  // Check that all fields are provided
  if (!day || !startTime || !endTime) {
    return { error: "Please provide all availability information." };
  }

  // Validate time format (HH:MM). The end time can also be 24:00 (midnight).
  const timeFormat = /^([01]\d|2[0-3]):[0-5]\d$/;

  if (!timeFormat.test(startTime) || !(timeFormat.test(endTime) || endTime === "24:00")) {
    return { error: "Invalid time format." };
  }

  // End time must be later than start time
  if (endTime <= startTime) {
    return { error: "End time must be later than start time." };
  }

  // Get existing availability for this user
  const existingAvailability = await db.getAvailability(userId);

  // Check for overlapping time slots
  const hasOverlap = existingAvailability.some((item) => {
    return (
      item.day === day &&
      startTime < item.endTime &&
      endTime > item.startTime
    );
  });

  if (hasOverlap) {
    return { error: "This time slot overlaps with existing availability." };
  }

  // Save valid availability
  await db.addAvailability({
    userId,
    day,
    startTime,
    endTime,
  });

  revalidatePath("/availability");
  return {};
}

export async function removeAvailability(id: string) {
  const userId = await currentUserId();

  await db.removeAvailability(userId, id);

  revalidatePath("/availability");
}