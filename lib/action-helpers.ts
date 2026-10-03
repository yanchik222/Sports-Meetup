import "server-only";
import { withAuth } from "@workos-inc/authkit-nextjs";

export async function currentUserId() {
  const { user } = await withAuth({ ensureSignedIn: true });
  return user.id;
}

export function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

// Returns the value if it's one of the allowed options, otherwise "".
export function oneOf(options: readonly string[], value: string) {
  return options.includes(value) ? value : "";
}
