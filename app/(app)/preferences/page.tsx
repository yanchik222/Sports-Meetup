import { withAuth } from "@workos-inc/authkit-nextjs";
import { getProfile, PLAY_STYLES, SKILL_LEVELS, SPORTS, GROUP_SIZES, DISTANCE_RANGES } from "@/lib/db";
import { CITIES } from "@/lib/cities";
import { savePreferences } from "./actions";
import { CheckIcon } from "../components/icons";
import { PageShell, Section } from "../components/ui";

export default async function PreferencesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { user } = await withAuth({ ensureSignedIn: true });
  const profile = await getProfile(user.id);
  const { saved } = await searchParams;
  // Locations saved as free text before the city list existed.
  const oldLocation = profile?.location && !CITIES.includes(profile.location) ? profile.location : "";

  return (
    <PageShell title="Sport preferences" description="Tell other players what you play and how you like to play.">
      <form action={savePreferences} className="divide-y divide-slate-200/80">
        <Section side title="Sports" description="Pick every sport you'd play with someone.">
          {saved && (
            <p
              role="status"
              className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800"
            >
              <CheckIcon className="size-4" weight="bold" />
              Preferences saved.
            </p>
          )}
          <fieldset>
            <legend className="sr-only">Sports</legend>
            <div className="flex flex-wrap gap-2">
              {SPORTS.map((sport) => (
                <label
                  key={sport}
                  className="group inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white pr-4 pl-3 text-sm font-medium text-slate-700 transition-colors select-none hover:border-slate-400 has-[:checked]:border-brand-300 has-[:checked]:bg-brand-100 has-[:checked]:text-brand-900 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-brand-300"
                >
                  <input
                    type="checkbox"
                    name="sports"
                    value={sport}
                    defaultChecked={profile?.sports.includes(sport)}
                    className="sr-only"
                  />
                  <span className="grid size-4 place-items-center rounded-full border border-slate-300 bg-white group-has-[:checked]:border-brand-400 group-has-[:checked]:bg-brand-400">
                    <CheckIcon className="size-2.5 text-white opacity-0 group-has-[:checked]:opacity-100" weight="bold" />
                  </span>
                  {sport}
                </label>
              ))}
            </div>
          </fieldset>
        </Section>

        <Section side title="Skill and style" description="Helps players find a good match for their level.">
          <div className="grid gap-4 @lg:grid-cols-2">
            <div>
              <label className="label">Skill level</label>
              <select name="skillLevel" defaultValue={profile?.skillLevel} className="field">
                <option value="">Select…</option>
                {SKILL_LEVELS.map((level) => (
                  <option key={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Play style</label>
              <select name="playStyle" defaultValue={profile?.playStyle} className="field">
                <option value="">Select…</option>
                {PLAY_STYLES.map((style) => (
                  <option key={style}>{style}</option>
                ))}
              </select>
            </div>
          </div>
        </Section>

        <Section side title="Location" description="Used to find players near you.">
          <div className="grid gap-4 @lg:grid-cols-2">
            <div className="@lg:col-span-2">
              <label className="label">City</label>
              <select name="location" defaultValue={oldLocation ? "" : profile?.location} className="field">
                <option value="">Select…</option>
                {CITIES.map((city) => (
                  <option key={city}>{city}</option>
                ))}
              </select>
              {oldLocation && (
                <p className="mt-1.5 text-sm text-amber-800">
                  Your saved location &ldquo;{oldLocation}&rdquo; isn&apos;t in the list. Pick the closest city so
                  players can find you by distance.
                </p>
              )}
            </div>

            <div>
              <label className="label">Preferred distance</label>
              <select name="preferredDistance" defaultValue={profile?.preferredDistance} className="field">
                <option value="">Select…</option>
                {DISTANCE_RANGES.map((distance) => (
                  <option key={distance}>{distance}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Preferred group size</label>
              <select name="preferredGroupSize" defaultValue={profile?.preferredGroupSize} className="field">
                <option value="">Select…</option>
                {GROUP_SIZES.map((size) => (
                  <option key={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>
        </Section>

        <div className="flex justify-end py-7">
          <button type="submit" className="btn btn-primary w-full @lg:w-auto">
            Save preferences
          </button>
        </div>
      </form>
    </PageShell>
  );
}
