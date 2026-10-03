"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as db from "@/lib/db";
import { currentUserId, oneOf, text } from "@/lib/action-helpers";

export async function savePreferences(form: FormData) {
  const userId = await currentUserId();
  await db.savePreferences(userId, {
    sports: form.getAll("sports").map(String).filter((s) => oneOf(db.SPORTS, s)),
    skillLevel: oneOf(db.SKILL_LEVELS, text(form, "skillLevel")),
    location: text(form, "location"),
    playStyle: oneOf(db.PLAY_STYLES, text(form, "playStyle")),
  });
  revalidatePath("/preferences");
  redirect("/preferences?saved=1");
}
