import { withAuth } from "@workos-inc/authkit-nextjs";
import { getProfile, PLAY_STYLES, SKILL_LEVELS, SPORTS, GROUP_SIZES, DISTANCE_RANGES } from "@/lib/db";
import { savePreferences } from "./actions";
import { Card } from "../components/Card";

export default async function PreferencesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { user } = await withAuth({ ensureSignedIn: true });
  const profile = await getProfile(user.id);
  const { saved } = await searchParams;

  return (
    <Card title="Sport Preferences" description="Tell other players what you play and how you like to play.">
      {saved && <p className="mb-4 rounded bg-green-100 p-3 text-green-800">Preferences saved.</p>}

      <form action={savePreferences} className="space-y-6">
        <fieldset>
          <legend className="mb-2 font-medium">Sports</legend>
          <div className="grid grid-cols-2 gap-2">
            {SPORTS.map((sport) => (
              <label key={sport} className="flex items-center gap-2">
                <input type="checkbox" name="sports" value={sport} defaultChecked={profile?.sports.includes(sport)} />
                {sport}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label className="mb-1 block font-medium">Skill Level</label>
          <select name="skillLevel" defaultValue={profile?.skillLevel} className="w-full rounded border p-2">
            <option value="">Select…</option>
            {SKILL_LEVELS.map((level) => (
              <option key={level}>{level}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block font-medium">Location</label>
          <input
            name="location"
            placeholder="Ex: San Jose, CA"
            defaultValue={profile?.location}
            className="w-full rounded border p-2"
          />
        </div>

        <div>
          <label className="mb-1 block font-medium">Preferred Distance</label>
          <select
            name="preferredDistance"
            defaultValue={profile?.preferredDistance}
            className="w-full rounded border p-2"
          >
            <option value="">Select…</option>
            {DISTANCE_RANGES.map((distance) => (
              <option key={distance}>{distance}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block font-medium">Preferred Group Size</label>
          <select
            name="preferredGroupSize"
            defaultValue={profile?.preferredGroupSize}
            className="w-full rounded border p-2"
          >
            <option value="">Select…</option>
            {GROUP_SIZES.map((size) => (
              <option key={size}>{size}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block font-medium">Play Style</label>
          <select name="playStyle" defaultValue={profile?.playStyle} className="w-full rounded border p-2">
            <option value="">Select…</option>
            {PLAY_STYLES.map((style) => (
              <option key={style}>{style}</option>
            ))}
          </select>
        </div>

        <button type="submit" className="rounded bg-blue-600 px-4 py-2 font-medium text-white">
          Save Preferences
        </button>
      </form>
    </Card>
  );
}
