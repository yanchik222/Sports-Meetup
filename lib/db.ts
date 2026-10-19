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
export const DISTANCE_RANGES = ["5 miles", "10 miles", "25 miles", "50+ miles"] as const;
export const GROUP_SIZES = ["1-on-1", "Small Group", "Large Group", "Any"] as const;

export type Profile = {
  id: string; // WorkOS user id
  name: string;
  email: string;
  sports: string[];
  skillLevel: string;
  location: string;
  playStyle: string;
  preferredDistance: string;
  preferredGroupSize: string;
};

export type Availability = {
  id: string;
  userId: string;
  day: string;
  startTime: string;
  endTime: string;
};

export type RequestStatus = "pending" | "accepted" | "declined" | "cancelled" | "completed";

// A new time one player suggested for an accepted match. The match keeps its
// current time until the other player accepts.
export type Reschedule = {
  date: string;
  time: string;
  duration: number;
  location: string;
  proposedBy: string;
};

export type PlayRequest = {
  id: string;
  fromUserId: string;
  toUserId: string;
  sport: string;
  date: string;
  time: string;
  duration?: number; // minutes; missing on requests made before durations existed
  location: string;
  message: string;
  status: RequestStatus;
  proposedBy?: string; // who suggested the current time if it isn't fromUserId
  reschedule?: Reschedule;
  createdAt: string;
  updatedAt?: string;
  cancelledBy?: string;
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
      data.profiles.push({ id: user.id, name, email: user.email, sports: [], skillLevel: "", location: "", playStyle: "", preferredDistance: "", preferredGroupSize: ""});
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
  prefs: Pick<Profile, "sports" | "skillLevel" | "location" | "playStyle"| "preferredDistance" | "preferredGroupSize">,
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

export async function getRequests() {
  return (await load()).requests;
}

export async function getRequestsFor(userId: string) {
  return (await load()).requests.filter((r) => r.fromUserId === userId || r.toUserId === userId);
}

type NewRequest = Pick<PlayRequest, "fromUserId" | "toUserId" | "sport" | "date" | "time" | "duration" | "location" | "message">;

// Adds the request only if `allowed` approves it against the current requests.
// The check runs inside the write lock so two requests can't both slip through.
export async function createRequest(req: NewRequest, allowed: (requests: PlayRequest[]) => boolean) {
  return update((data) => {
    if (!allowed(data.requests)) return false;
    data.requests.push({ id: randomUUID(), status: "pending", createdAt: new Date().toISOString(), ...req });
    return true;
  });
}

type RequestChanges = Partial<Omit<PlayRequest, "id" | "fromUserId" | "toUserId" | "createdAt">>;

// Applies changes only if `allowed` approves them for this request, checked
// against the current requests inside the write lock.
export async function updateRequest(
  id: string,
  allowed: (req: PlayRequest, requests: PlayRequest[]) => boolean,
  changes: RequestChanges | ((req: PlayRequest) => RequestChanges),
) {
  return update((data) => {
    const req = data.requests.find((r) => r.id === id);
    if (!req || !allowed(req, data.requests)) return false;
    Object.assign(req, typeof changes === "function" ? changes(req) : changes, { updatedAt: new Date().toISOString() });
    return true;
  });
}
