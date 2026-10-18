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
    <form action={formAction} className="mt-3 grid grid-cols-2 gap-3">
      <input type="hidden" name="toUserId" value={player.id} />

      {player.availability.length > 0 && (
        <div className="col-span-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-gray-600">Pick one of their times:</span>
          {player.availability.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => pickSlot(a)}
              className="rounded border px-2 py-1 hover:bg-gray-100"
            >
              {a.day.slice(0, 3)} {formatTime(a.startTime)}
            </button>
          ))}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">Sport</label>
        <select
          name="sport"
          required
          value={sport}
          onChange={(event) => setSport(event.target.value)}
          className="w-full rounded border p-2"
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

      <div className="col-span-2">
        <label className="mb-1 block text-sm font-medium">Where</label>
        <input
          name="location"
          placeholder="Court, park, or gym"
          maxLength={100}
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          className="w-full rounded border p-2"
        />
      </div>

      <input
        name="message"
        placeholder="Message (optional)"
        maxLength={300}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        className="col-span-2 rounded border p-2"
      />

      {player.availability.length === 0 ? (
        <p className="col-span-2 text-sm text-gray-500">{player.name} hasn&apos;t added availability yet.</p>
      ) : (
        !fitsAvailability && (
          <p className="col-span-2 text-sm text-amber-700">
            {player.name} isn&apos;t usually available then. You can still send the request.
          </p>
        )
      )}

      {state.error && (
        <p aria-live="polite" className="col-span-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state.sent && <p className="col-span-2 text-sm text-green-700">Request sent!</p>}

      <button
        type="submit"
        disabled={pending}
        className="col-span-2 rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send Request"}
      </button>
    </form>
  );
}
