"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as db from "@/lib/db";
import { currentUserId, oneOf, text } from "@/lib/action-helpers";
import { CITIES } from "@/lib/cities";

export async function savePreferences(form: FormData) {
  const userId = await currentUserId();
  await db.savePreferences(userId, {
    sports: form.getAll("sports").map(String).filter((s) => oneOf(db.SPORTS, s)),
    skillLevel: oneOf(db.SKILL_LEVELS, text(form, "skillLevel")),
    location: oneOf(CITIES, text(form, "location")),
    playStyle: oneOf(db.PLAY_STYLES, text(form, "playStyle")),
    preferredDistance: oneOf(db.DISTANCE_RANGES, text(form, "preferredDistance")),
    preferredGroupSize: oneOf(db.GROUP_SIZES, text(form, "preferredGroupSize")),
  });
  revalidatePath("/preferences");
  redirect("/preferences?saved=1");
}
