import Link from "next/link";
import { withAuth } from "@workos-inc/authkit-nextjs";
import {
  DAYS,
  getAvailability,
  getProfile,
  getProfiles,
  getRequestsFor,
  GROUP_SIZES,
  SKILL_LEVELS,
  SPORTS,
  type Availability,
  type PlayRequest,
  type Profile,
} from "@/lib/db";
import { CITIES, distanceMiles } from "@/lib/cities";
import { proposerOf } from "@/lib/schedule";
import { formatDate, formatTime, hasPassed } from "@/lib/time";
import { Card } from "../components/Card";
import RequestForm from "./RequestForm";

type Filters = {
  sport?: string;
  skill?: string;
  near?: string;
  distance?: string;
  group?: string;
  day?: string;
  search?: string;
};

const DISTANCE_OPTIONS = ["5", "10", "25", "50"];
const GROUP_OPTIONS = GROUP_SIZES.filter((size) => size !== "Any");

// A saved preferred distance as a search radius. "50+ miles" means no limit.
function preferredMiles(preference = "") {
  return preference.endsWith("+ miles") ? "" : String(parseInt(preference) || "");
}

function formatDistance(miles: number) {
  return miles < 1 ? "Same city" : `~${Math.round(miles)} mi away`;
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

  // Near, distance, and group size start from your saved preferences until
  // you pick something else.
  const me = await getProfile(user.id);
  const near = CITIES.find((city) => city === (filters.near ?? me?.location));
  const distance = DISTANCE_OPTIONS.find(
    (miles) => miles === (filters.distance ?? preferredMiles(me?.preferredDistance))
  );
  const group = GROUP_OPTIONS.find(
    (size) => size === (filters.group ?? me?.preferredGroupSize)
  );
  const maxMiles = near && distance ? Number(distance) : undefined;

  const [profiles, availability, requests] = shouldShowResults
    ? await Promise.all([getProfiles(), getAvailability(), getRequestsFor(user.id)])
    : [[], [], []];

  const matches = profiles
    .filter((p) => p.id !== user.id)
    .map((p) => ({
      ...p,
      miles: near ? distanceMiles(near, p.location) : undefined,
      availability: availability.filter((a) => a.userId === p.id),
      requests: requests.filter(
        (r) => r.fromUserId === p.id || r.toUserId === p.id
      ),
    }))
    .filter(
      (p) =>
        p.sports.includes(selectedSport!) &&
        (!filters.skill || p.skillLevel === filters.skill) &&
        // Players who haven't picked a group size are open to any.
        (!group ||
          !p.preferredGroupSize ||
          p.preferredGroupSize === group ||
          p.preferredGroupSize === "Any") &&
        (!filters.day ||
          p.availability.some((a) => a.day === filters.day))
    );

  const players = matches.filter(
    (p) => !maxMiles || (p.miles !== undefined && p.miles <= maxMiles)
  );
  const playersWithoutCity = maxMiles
    ? matches.filter((p) => p.miles === undefined).length
    : 0;
  if (near) {
    players.sort((a, b) => (a.miles ?? Infinity) - (b.miles ?? Infinity));
  }

  return (
    <Card
      title="Find Players"
      description="Find players based on sport, skill level, distance, group size, and availability."
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
            Near
          </label>
          <select
            name="near"
            defaultValue={near ?? ""}
            className="w-full rounded border p-2"
          >
            <option value="">Anywhere</option>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Distance
          </label>
          <select
            name="distance"
            defaultValue={distance ?? ""}
            className="w-full rounded border p-2"
          >
            <option value="">Any distance</option>
            {DISTANCE_OPTIONS.map((miles) => (
              <option key={miles} value={miles}>
                Within {miles} miles
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Group Size
          </label>
          <select
            name="group"
            defaultValue={group ?? ""}
            className="w-full rounded border p-2"
          >
            <option value="">Any group size</option>
            {GROUP_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
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

        <p className="col-span-2 text-sm text-gray-500">
          Near, Distance, and Group Size start from your{" "}
          <Link href="/preferences" className="text-blue-600 underline">
            Sport Preferences
          </Link>
          .
        </p>
      </form>

      {playersWithoutCity > 0 && (
        <p className="mb-3 text-sm text-gray-500">
          {playersWithoutCity === 1
            ? "1 more player hasn't set a city, so they don't"
            : `${playersWithoutCity} more players haven't set a city, so they don't`}{" "}
          show up when searching by distance.
        </p>
      )}

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
                {[
                  p.skillLevel,
                  p.playStyle,
                  p.location,
                  p.miles !== undefined && formatDistance(p.miles),
                ]
                  .filter(Boolean)
                  .join(" · ") || "No preferences set yet"}
              </p>

              {p.sports.length > 0 && (
                <p className="mt-2 text-sm">
                  <strong>Sports:</strong> {p.sports.join(", ")}
                </p>
              )}

              {(p.preferredGroupSize || p.preferredDistance) && (
                <p className="mt-2 text-sm">
                  <strong>Prefers:</strong>{" "}
                  {[
                    p.preferredGroupSize === "Any"
                      ? "Any group size"
                      : p.preferredGroupSize,
                    p.preferredDistance &&
                      (p.preferredDistance.endsWith("+ miles")
                        ? `Travels ${p.preferredDistance}`
                        : `Within ${p.preferredDistance}`),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
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

              <RequestStatus
                player={p}
                userId={user.id}
                sport={selectedSport!}
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// Shows any pending or upcoming match with this player, or the request form
// when there isn't an active pending request between you.
function RequestStatus({
  player,
  userId,
  sport,
}: {
  player: Profile & { availability: Availability[]; requests: PlayRequest[] };
  userId: string;
  sport: string;
}) {
  const pending = player.requests.find(
    (r) => r.status === "pending" && !hasPassed(r.date)
  );
  const upcoming = player.requests
    .filter((r) => r.status === "accepted" && !hasPassed(r.date))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const when = (r: { date: string; time: string }) =>
    `${formatDate(r.date)} at ${formatTime(r.time)}`;

  return (
    <div className="mt-3 space-y-2">
      {upcoming.map((r) => (
        <p key={r.id} className="text-sm text-green-700">
          <strong>Upcoming:</strong> {r.sport} on {when(r)}
        </p>
      ))}

      {pending ? (
        <p className="rounded bg-blue-50 p-3 text-sm text-blue-800">
          {proposerOf(pending) === userId
            ? `You sent a request for ${pending.sport} on ${when(pending)}. Waiting for ${player.name} to respond.`
            : `${player.name} sent you a request for ${pending.sport} on ${when(pending)}.`}{" "}
          <Link href="/requests" className="font-medium underline">
            {proposerOf(pending) === userId ? "View request" : "Respond"}
          </Link>
        </p>
      ) : (
        <details>
          <summary className="cursor-pointer font-medium text-blue-600">
            Request to play
          </summary>

          <RequestForm
            player={{
              id: player.id,
              name: player.name,
              sports: player.sports,
              location: player.location,
              availability: player.availability,
            }}
            defaultSport={sport}
          />
        </details>
      )}
    </div>
  );
}
