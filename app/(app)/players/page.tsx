import { withAuth } from "@workos-inc/authkit-nextjs";
import { DAYS, getAvailability, getProfiles, SKILL_LEVELS, SPORTS } from "@/lib/db";
import { sendRequest } from "../requests/actions";
import { Card } from "../components/Card";

type Filters = { sport?: string; skill?: string; location?: string; day?: string };

export default async function PlayersPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const { user } = await withAuth({ ensureSignedIn: true });
  const filters = await searchParams;
  const [profiles, availability] = await Promise.all([getProfiles(), getAvailability()]);

  const players = profiles
    .filter((p) => p.id !== user.id)
    .map((p) => ({ ...p, availability: availability.filter((a) => a.userId === p.id) }))
    .filter(
      (p) =>
        (!filters.sport || p.sports.includes(filters.sport)) &&
        (!filters.skill || p.skillLevel === filters.skill) &&
        (!filters.location || p.location.toLowerCase().includes(filters.location.toLowerCase())) &&
        (!filters.day || p.availability.some((a) => a.day === filters.day)),
    );

  return (
    <Card title="Find Players" description="Search by sport, skill level, location, and availability.">
      <form className="mb-6 grid grid-cols-2 gap-3">
        <select name="sport" defaultValue={filters.sport} className="rounded border p-2">
          <option value="">Any sport</option>
          {SPORTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select name="skill" defaultValue={filters.skill} className="rounded border p-2">
          <option value="">Any skill level</option>
          {SKILL_LEVELS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <input name="location" placeholder="Location" defaultValue={filters.location} className="rounded border p-2" />
        <select name="day" defaultValue={filters.day} className="rounded border p-2">
          <option value="">Any day</option>
          {DAYS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <button type="submit" className="col-span-2 rounded bg-blue-600 px-4 py-2 font-medium text-white">
          Search
        </button>
      </form>

      {players.length === 0 ? (
        <p className="text-gray-500">No players match your search.</p>
      ) : (
        <div className="space-y-3">
          {players.map((p) => (
            <div key={p.id} className="rounded border p-4">
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="text-sm text-gray-600">
                {[p.skillLevel, p.playStyle, p.location].filter(Boolean).join(" · ") || "No preferences set yet"}
              </p>
              {p.sports.length > 0 && <p className="mt-1">{p.sports.join(", ")}</p>}
              {p.availability.length > 0 && (
                <p className="mt-1 text-sm text-gray-600">
                  Available: {p.availability.map((a) => `${a.day} ${a.startTime}-${a.endTime}`).join(", ")}
                </p>
              )}

              <details className="mt-3">
                <summary className="cursor-pointer font-medium text-blue-600">Request to play</summary>
                <form action={sendRequest} className="mt-3 grid grid-cols-2 gap-3">
                  <input type="hidden" name="toUserId" value={p.id} />
                  <select name="sport" required className="rounded border p-2">
                    {(p.sports.length ? p.sports : SPORTS).map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <input name="location" placeholder="Where" defaultValue={p.location} className="rounded border p-2" />
                  <input type="date" name="date" required className="rounded border p-2" />
                  <input type="time" name="time" required className="rounded border p-2" />
                  <input name="message" placeholder="Message (optional)" className="col-span-2 rounded border p-2" />
                  <button type="submit" className="col-span-2 rounded bg-blue-600 px-4 py-2 font-medium text-white">
                    Send Request
                  </button>
                </form>
              </details>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
