import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

// Temporary JSON-file storage so features work end to end before we pick a
// real database. Everything goes through this module, so swapping it out
// later won't touch the pages.

export const SPORTS = [
  "Basketball",
  "Soccer",
  "Tennis",
  "Volleyball",
  "Pickleball",
  "Badminton",
  "Table Tennis",
  "Running",
] as const;
export const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
export const PLAY_STYLES = ["Casual", "Competitive", "Either"] as const;
export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export type Profile = {
  id: string; // WorkOS user id
  name: string;
  email: string;
  sports: string[];
  skillLevel: string;
  location: string;
  playStyle: string;
};

export type Availability = {
  id: string;
  userId: string;
  day: string;
  startTime: string;
  endTime: string;
};

export type RequestStatus = "pending" | "accepted" | "declined" | "cancelled" | "completed";

export type PlayRequest = {
  id: string;
  fromUserId: string;
  toUserId: string;
  sport: string;
  date: string;
  time: string;
  location: string;
  message: string;
  status: RequestStatus;
  createdAt: string;
  completedAt?: string;
  result?: string;
};

type Data = {
  profiles: Profile[];
  availability: Availability[];
  requests: PlayRequest[];
};

const DB_FILE = path.join(process.cwd(), "data", "db.json");

async function load(): Promise<Data> {
  try {
    return JSON.parse(await fs.readFile(DB_FILE, "utf8"));
  } catch {
    return { profiles: [], availability: [], requests: [] };
  }
}

// Serialize writes so concurrent requests don't clobber each other.
let queue: Promise<unknown> = Promise.resolve();
function update<T>(fn: (data: Data) => T): Promise<T> {
  const run = queue.then(async () => {
    const data = await load();
    const result = fn(data);
    await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

// Profiles

export async function upsertUser(user: { id: string; email: string; firstName: string | null; lastName: string | null }) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const existing = (await load()).profiles.find((p) => p.id === user.id);
  if (existing && existing.name === name && existing.email === user.email) return;

  await update((data) => {
    const profile = data.profiles.find((p) => p.id === user.id);
    if (profile) {
      profile.name = name;
      profile.email = user.email;
    } else {
      data.profiles.push({ id: user.id, name, email: user.email, sports: [], skillLevel: "", location: "", playStyle: "" });
    }
  });
}

export async function getProfile(userId: string) {
  return (await load()).profiles.find((p) => p.id === userId);
}

export async function getProfiles() {
  return (await load()).profiles;
}

export async function savePreferences(
  userId: string,
  prefs: Pick<Profile, "sports" | "skillLevel" | "location" | "playStyle">,
) {
  await update((data) => {
    const profile = data.profiles.find((p) => p.id === userId);
    if (profile) Object.assign(profile, prefs);
  });
}

// Availability

export async function getAvailability(userId?: string) {
  const all = (await load()).availability;
  return userId ? all.filter((a) => a.userId === userId) : all;
}

export async function addAvailability(entry: Omit<Availability, "id">) {
  await update((data) => {
    data.availability.push({ id: randomUUID(), ...entry });
  });
}

export async function removeAvailability(userId: string, id: string) {
  await update((data) => {
    data.availability = data.availability.filter((a) => !(a.id === id && a.userId === userId));
  });
}

// Play requests

export async function getRequestsFor(userId: string) {
  return (await load()).requests.filter((r) => r.fromUserId === userId || r.toUserId === userId);
}

export async function createRequest(req: Omit<PlayRequest, "id" | "status" | "createdAt">) {
  await update((data) => {
    data.requests.push({ id: randomUUID(), status: "pending", createdAt: new Date().toISOString(), ...req });
  });
}

// Applies a status change only if `allowed` approves it for this user.
export async function updateRequest(
  id: string,
  allowed: (req: PlayRequest) => boolean,
  changes: Partial<Pick<PlayRequest, "status" | "completedAt" | "result">>,
) {
  return update((data) => {
    const req = data.requests.find((r) => r.id === id);
    if (!req || !allowed(req)) return false;
    Object.assign(req, changes);
    return true;
  });
}
