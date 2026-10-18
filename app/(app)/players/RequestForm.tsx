"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import { sendRequest, type SendRequestState } from "../requests/actions";
import { dayOfWeek, formatTime, nextDateFor, to12HourParts, to24Hour, toDateString, toTimeString } from "@/lib/time";

type Slot = { id: string; day: string; startTime: string; endTime: string };

type Player = {
  id: string;
  name: string;
  sports: string[];
  location: string;
  availability: Slot[];
};

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = ["00", "15", "30", "45"];

// Today's date in the browser's timezone. Empty during server rendering so the
// date picker's minimum always matches the player's own calendar.
function useToday() {
  return useSyncExternalStore(
    () => () => {},
    () => toDateString(new Date()),
    () => "",
  );
}

export default function RequestForm({ player, defaultSport }: { player: Player; defaultSport: string }) {
  const [state, formAction, pending] = useActionState<SendRequestState, FormData>(sendRequest, {});
  const today = useToday();

  const [sport, setSport] = useState(player.sports.includes(defaultSport) ? defaultSport : player.sports[0] ?? "");
  const [location, setLocation] = useState(player.location);
  const [date, setDate] = useState("");
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const [period, setPeriod] = useState("PM");
  const [message, setMessage] = useState("");

  const time = to24Hour(hour, minute, period);
  const fitsAvailability =
    !date ||
    player.availability.some((a) => a.day === dayOfWeek(date) && a.startTime <= time && time < a.endTime);

  // Fill in the next upcoming date and start time for one of the player's slots.
  function pickSlot(slot: Slot) {
    const now = new Date();
    const from = slot.startTime > toTimeString(now) ? now : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const parts = to12HourParts(slot.startTime);

    setDate(nextDateFor(slot.day, from));
    setHour(parts.hour);
    setMinute(parts.minute);
    setPeriod(parts.period);
  }

  return (
    <form action={formAction} className="mt-3 grid grid-cols-2 gap-3">
      <input type="hidden" name="toUserId" value={player.id} />
      <input type="hidden" name="time" value={time} />

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

      <div>
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

      <div>
        <label className="mb-1 block text-sm font-medium">Date</label>
        <input
          type="date"
          name="date"
          required
          min={today || undefined}
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="w-full rounded border p-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Time</label>
        <div className="flex gap-1">
          <select value={hour} onChange={(event) => setHour(event.target.value)} className="w-1/3 rounded border p-2">
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          <select
            value={minute}
            onChange={(event) => setMinute(event.target.value)}
            className="w-1/3 rounded border p-2"
          >
            {MINUTES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="w-1/3 rounded border p-2"
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
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
