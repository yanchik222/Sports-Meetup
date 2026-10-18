import Link from "next/link";
import { withAuth } from "@workos-inc/authkit-nextjs";
import {
  DAYS,
  getAvailability,
  getProfiles,
  SKILL_LEVELS,
  SPORTS,
} from "@/lib/db";
import { sendRequest } from "../requests/actions";
import { Card } from "../components/Card";

type Filters = {
  sport?: string;
  skill?: string;
  location?: string;
  day?: string;
  search?: string;
};

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour = hours % 12 || 12;

  return `${hour}:${String(minutes).padStart(2, "0")} ${period}`;
}

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<Filters>;
}) {
  const { user } = await withAuth({ ensureSignedIn: true });
  const filters = await searchParams;

  const selectedSport = SPORTS.find((sport) => sport === filters.sport);
  const hasSearched = filters.search === "true";
  const shouldShowResults = hasSearched && !!selectedSport;

  const [profiles, availability] = shouldShowResults
    ? await Promise.all([getProfiles(), getAvailability()])
    : [[], []];

  const players = profiles
    .filter((p) => p.id !== user.id)
    .map((p) => ({
      ...p,
      availability: availability.filter((a) => a.userId === p.id),
    }))
    .filter(
      (p) =>
        p.sports.includes(selectedSport!) &&
        (!filters.skill || p.skillLevel === filters.skill) &&
        (!filters.location ||
          p.location
            .toLowerCase()
            .includes(filters.location.toLowerCase())) &&
        (!filters.day ||
          p.availability.some((a) => a.day === filters.day))
    );

  return (
    <Card
      title="Find Players"
      description="Find players based on sport, skill level, location, and availability."
    >
      <form
        key={shouldShowResults ? "searched" : "cleared"}
        className="mb-6 grid grid-cols-2 gap-3"
      >
        <input type="hidden" name="search" value="true" />

        <div>
          <label className="mb-1 block text-sm font-medium">
            Sport *
          </label>
          <select
            name="sport"
            required
            defaultValue={filters.sport || ""}
            className="w-full rounded border p-2"
          >
            <option value="">Select a sport</option>
            {SPORTS.map((sport) => (
              <option key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Skill Level
          </label>
          <select
            name="skill"
            defaultValue={filters.skill || ""}
            className="w-full rounded border p-2"
          >
            <option value="">Any skill level</option>
            {SKILL_LEVELS.map((skill) => (
              <option key={skill} value={skill}>
                {skill}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Location
          </label>
          <input
            name="location"
            placeholder="City or area"
            defaultValue={filters.location || ""}
            className="w-full rounded border p-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Availability
          </label>
          <select
            name="day"
            defaultValue={filters.day || ""}
            className="w-full rounded border p-2"
          >
            <option value="">Any day</option>
            {DAYS.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white"
        >
          Search
        </button>

        <Link
          href="/players"
          className="rounded border px-4 py-2 text-center font-medium text-gray-700"
        >
          Clear Filters
        </Link>
      </form>

      {!shouldShowResults ? (
        <p className="text-gray-500">
          Select a sport and click Search to find players.
        </p>
      ) : players.length === 0 ? (
        <p className="text-gray-500">
          No players match your search.
        </p>
      ) : (
        <div className="space-y-3">
          {players.map((p) => (
            <div key={p.id} className="rounded border p-4">
              <h3 className="text-lg font-semibold">{p.name}</h3>

              <p className="text-sm text-gray-600">
                {[p.skillLevel, p.playStyle, p.location]
                  .filter(Boolean)
                  .join(" · ") || "No preferences set yet"}
              </p>

              {p.sports.length > 0 && (
                <p className="mt-2 text-sm">
                  <strong>Sports:</strong> {p.sports.join(", ")}
                </p>
              )}

              {p.availability.length > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  <strong>Available:</strong>{" "}
                  {p.availability
                    .map(
                      (a) =>
                        `${a.day} ${formatTime(a.startTime)} - ${formatTime(a.endTime)}`
                    )
                    .join(", ")}
                </p>
              )}

              <details className="mt-3">
                <summary className="cursor-pointer font-medium text-blue-600">
                  Request to play
                </summary>

                <form
                  action={sendRequest}
                  className="mt-3 grid grid-cols-2 gap-3"
                >
                  <input
                    type="hidden"
                    name="toUserId"
                    value={p.id}
                  />

                  <select
                    name="sport"
                    required
                    className="rounded border p-2"
                  >
                    {p.sports.map((sport) => (
                      <option key={sport} value={sport}>
                        {sport}
                      </option>
                    ))}
                  </select>

                  <input
                    name="location"
                    placeholder="Where"
                    defaultValue={p.location}
                    className="rounded border p-2"
                  />

                  <input
                    type="date"
                    name="date"
                    required
                    className="rounded border p-2"
                  />

                  <input
                    type="time"
                    name="time"
                    required
                    className="rounded border p-2"
                  />

                  <input
                    name="message"
                    placeholder="Message (optional)"
                    className="col-span-2 rounded border p-2"
                  />

                  <button
                    type="submit"
                    className="col-span-2 rounded bg-blue-600 px-4 py-2 font-medium text-white"
                  >
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