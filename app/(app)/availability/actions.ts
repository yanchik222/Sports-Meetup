"use server";

import { revalidatePath } from "next/cache";
import * as db from "@/lib/db";
import { currentUserId, oneOf } from "@/lib/action-helpers";

export async function addAvailability(entry: {
  day: string;
  startTime: string;
  endTime: string;
}) {
  const userId = await currentUserId();

  const day = oneOf(db.DAYS, entry.day);
  const startTime = entry.startTime.trim();
  const endTime = entry.endTime.trim();

  // Check that all fields are provided
  if (!day || !startTime || !endTime) {
    throw new Error("Please provide all availability information.");
  }

  // Validate time format (HH:MM)
  const timeFormat = /^([01]\d|2[0-3]):[0-5]\d$/;

  if (!timeFormat.test(startTime) || !timeFormat.test(endTime)) {
    throw new Error("Invalid time format.");
  }

  // End time must be later than start time
  if (endTime <= startTime) {
    throw new Error("End time must be later than start time.");
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
    throw new Error("This time slot overlaps with existing availability.");
  }

  // Save valid availability
  await db.addAvailability({
    userId,
    day,
    startTime,
    endTime,
  });

  revalidatePath("/availability");
}

export async function removeAvailability(id: string) {
  const userId = await currentUserId();

  await db.removeAvailability(userId, id);

  revalidatePath("/availability");
}