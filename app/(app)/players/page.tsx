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
import { CheckIcon, ChevronIcon, SearchIcon, SendIcon } from "../components/icons";
import { Avatar, Empty, PageShell, Section } from "../components/ui";
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
    <PageShell
      title="Find players"
      description="Search by sport, skill level, distance, group size, and availability."
    >
      <Section>
        <form
          key={shouldShowResults ? "searched" : "cleared"}
          className="grid grid-cols-2 gap-x-3 gap-y-4 @2xl:grid-cols-3"
        >
          <input type="hidden" name="search" value="true" />

          <div>
            <label className="label">
              Sport <span className="text-brand-700">*</span>
            </label>
            <select
              name="sport"
              required
              defaultValue={filters.sport || ""}
              className="field"
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
            <label className="label">Skill level</label>
            <select
              name="skill"
              defaultValue={filters.skill || ""}
              className="field"
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
            <label className="label">Availability</label>
            <select
              name="day"
              defaultValue={filters.day || ""}
              className="field"
            >
              <option value="">Any day</option>
              {DAYS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Near</label>
            <select
              name="near"
              defaultValue={near ?? ""}
              className="field"
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
            <label className="label">Distance</label>
            <select
              name="distance"
              defaultValue={distance ?? ""}
              className="field"
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
            <label className="label">Group size</label>
            <select
              name="group"
              defaultValue={group ?? ""}
              className="field"
            >
              <option value="">Any group size</option>
              {GROUP_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2 flex flex-wrap items-center gap-x-3 gap-y-2 @2xl:col-span-3">
            <button type="submit" className="btn btn-primary">
              <SearchIcon className="size-4" weight="bold" />
              Search
            </button>
            <Link href="/players" className="btn btn-secondary">
              Clear filters
            </Link>
            <p className="w-full text-sm text-slate-500 @xl:w-auto">
              Near, distance, and group size start from your{" "}
              <Link href="/preferences" className="link">
                sport preferences
              </Link>
              .
            </p>
          </div>
        </form>
      </Section>

      {!shouldShowResults ? (
        <Section>
          <Empty>Select a sport and click Search to find players.</Empty>
        </Section>
      ) : (
        <Section
          title={`${players.length} ${players.length === 1 ? "player" : "players"} found`}
          description={
            playersWithoutCity > 0
              ? `${playersWithoutCity} more ${playersWithoutCity === 1 ? "player hasn't" : "players haven't"} set a city, so they don't show up when searching by distance.`
              : undefined
          }
        >
          {players.length === 0 ? (
            <Empty>No players match your search.</Empty>
          ) : (
            <ul className="-my-5 divide-y divide-slate-100">
              {players.map((p) => (
                <li key={p.id} className="flex gap-3.5 py-5">
                  <Avatar name={p.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <h3 className="text-[15px] font-semibold text-slate-900">
                        {p.name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {[
                          p.location || "No city set",
                          p.miles !== undefined && formatDistance(p.miles),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>

                    <dl className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                      <Detail label="Skill" value={p.skillLevel} />
                      <Detail label="Style" value={p.playStyle} />
                      <Detail
                        label="Group"
                        value={
                          p.preferredGroupSize === "Any"
                            ? "Any size"
                            : p.preferredGroupSize
                        }
                      />
                      <Detail label="Travels" value={p.preferredDistance} />
                    </dl>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.sports.map((sport) => (
                        <span
                          key={sport}
                          className={sport === selectedSport ? "chip chip-brand" : "chip"}
                        >
                          {sport}
                        </span>
                      ))}
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      <span className="font-medium text-slate-700">Free: </span>
                      {p.availability.length === 0
                        ? "No times added yet"
                        : p.availability
                            .map(
                              (a) =>
                                `${a.day.slice(0, 3)} ${formatTime(a.startTime)} - ${formatTime(a.endTime)}`
                            )
                            .join(", ")}
                    </p>

                    <RequestStatus
                      player={p}
                      userId={user.id}
                      sport={selectedSport!}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}
    </PageShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">
        {value || <span className="font-normal text-slate-400">Not set</span>}
      </dd>
    </div>
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
    <div className="mt-4 space-y-3">
      {upcoming.map((r) => (
        <p
          key={r.id}
          className="flex items-center gap-2 text-sm font-medium text-emerald-700"
        >
          <CheckIcon className="size-4 shrink-0" weight="bold" />
          Upcoming: {r.sport} on {when(r)}
        </p>
      ))}

      {pending ? (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg bg-brand-50 px-3.5 py-3 text-sm text-brand-900">
          <p>
            {proposerOf(pending) === userId
              ? `You sent a request for ${pending.sport} on ${when(pending)}. Waiting for ${player.name} to respond.`
              : `${player.name} sent you a request for ${pending.sport} on ${when(pending)}.`}
          </p>
          <Link href="/requests" className="btn btn-secondary btn-sm">
            {proposerOf(pending) === userId ? "View request" : "Respond"}
          </Link>
        </div>
      ) : (
        <details className="group">
          <summary className="btn btn-primary btn-sm">
            <SendIcon className="size-4" />
            Request to play
            <ChevronIcon className="size-4 transition group-open:rotate-90" />
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
