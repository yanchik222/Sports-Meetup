"use client";

import { useActionState, useState } from "react";
import { sendRequest, type RequestFormState } from "../requests/actions";
import { DateField, DurationField, TimeField, useSchedule } from "../components/ScheduleFields";
import { dayOfWeek, formatTime, nextDateFor, toMinutes, toTimeString } from "@/lib/time";

type Slot = { id: string; day: string; startTime: string; endTime: string };

type Player = {
  id: string;
  name: string;
  sports: string[];
  location: string;
  availability: Slot[];
};

export default function RequestForm({ player, defaultSport }: { player: Player; defaultSport: string }) {
  const [state, formAction, pending] = useActionState<RequestFormState, FormData>(sendRequest, {});
  const schedule = useSchedule();

  const [sport, setSport] = useState(player.sports.includes(defaultSport) ? defaultSport : player.sports[0] ?? "");
  const [location, setLocation] = useState(player.location);
  const [message, setMessage] = useState("");

  // The whole match has to fit inside one of the player's time slots.
  const start = toMinutes(schedule.time);
  const fitsAvailability =
    !schedule.date ||
    player.availability.some(
      (a) =>
        a.day === dayOfWeek(schedule.date) &&
        toMinutes(a.startTime) <= start &&
        start + schedule.duration <= toMinutes(a.endTime),
    );

  // Fill in the next upcoming date and start time for one of the player's slots.
  function pickSlot(slot: Slot) {
    const now = new Date();
    const from = slot.startTime > toTimeString(now) ? now : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    schedule.set({ date: nextDateFor(slot.day, from), time: slot.startTime });
  }

  return (
    <form action={formAction} className="mt-3 grid gap-4 rounded-xl bg-slate-50 p-4 @lg:grid-cols-2 @lg:p-5">
      <input type="hidden" name="toUserId" value={player.id} />

      {player.availability.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm @lg:col-span-2">
          <span className="text-sm text-slate-600">Pick one of their times:</span>
          {player.availability.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => pickSlot(a)}
              className="h-9 rounded-full border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:border-brand-400 hover:bg-brand-50 active:translate-y-px"
            >
              {a.day.slice(0, 3)} {formatTime(a.startTime)}
            </button>
          ))}
        </div>
      )}

      <div>
        <label className="label">Sport</label>
        <select
          name="sport"
          required
          value={sport}
          onChange={(event) => setSport(event.target.value)}
          className="field"
        >
          {player.sports.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <DurationField schedule={schedule} />
      <DateField schedule={schedule} />
      <TimeField schedule={schedule} />

      <div className="@lg:col-span-2">
        <label className="label">Where</label>
        <input
          name="location"
          placeholder="Court, park, or gym"
          maxLength={100}
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          className="field"
        />
      </div>

      <input
        name="message"
        placeholder="Message (optional)"
        maxLength={300}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        className="field @lg:col-span-2"
      />

      {player.availability.length === 0 ? (
        <p className="text-sm text-slate-500 @lg:col-span-2">{player.name} hasn&apos;t added availability yet.</p>
      ) : (
        !fitsAvailability && (
          <p className="text-sm font-medium text-amber-800 @lg:col-span-2">
            {player.name} isn&apos;t usually available then. You can still send the request.
          </p>
        )
      )}

      {state.error && (
        <p aria-live="polite" className="text-sm font-medium text-red-700 @lg:col-span-2">
          {state.error}
        </p>
      )}
      {state.sent && <p className="text-sm font-semibold text-emerald-700 @lg:col-span-2">Request sent.</p>}

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary @lg:col-span-2 @lg:justify-self-start"
      >
        {pending ? "Sending…" : "Send request"}
      </button>
    </form>
  );
}
