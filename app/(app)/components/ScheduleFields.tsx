"use client";

import { useState, useSyncExternalStore } from "react";
import { DEFAULT_DURATION, DURATIONS, formatDuration, to12HourParts, to24Hour, toDateString } from "@/lib/time";

// Date, time, and length inputs shared by the forms that schedule a match.
// Each field renders its own grid cell; the time field also submits the
// 24-hour "time" value the server expects.

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = ["00", "15", "30", "45"];

type Values = { date: string; hour: string; minute: string; period: string; duration: number };

export type Schedule = Values & { time: string; set: (changes: Partial<Values> & { time?: string }) => void };

export function useSchedule(initial?: { date: string; time: string; duration: number }): Schedule {
  const [values, setValues] = useState<Values>(() =>
    initial
      ? { date: initial.date, ...to12HourParts(initial.time), duration: initial.duration }
      : { date: "", hour: "12", minute: "00", period: "PM", duration: DEFAULT_DURATION },
  );

  return {
    ...values,
    time: to24Hour(values.hour, values.minute, values.period),
    // Accepts a 24-hour `time` as a shortcut for setting hour, minute, and period.
    set: ({ time, ...changes }) =>
      setValues((current) => ({ ...current, ...(time ? to12HourParts(time) : {}), ...changes })),
  };
}

// Today's date in the browser's timezone. Empty during server rendering so the
// date picker's minimum always matches the player's own calendar.
function useToday() {
  return useSyncExternalStore(
    () => () => {},
    () => toDateString(new Date()),
    () => "",
  );
}

export function DateField({ schedule }: { schedule: Schedule }) {
  const today = useToday();

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">Date</label>
      <input
        type="date"
        name="date"
        required
        min={today || undefined}
        value={schedule.date}
        onChange={(event) => schedule.set({ date: event.target.value })}
        className="w-full rounded border p-2"
      />
    </div>
  );
}

export function TimeField({ schedule }: { schedule: Schedule }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">Time</label>
      <input type="hidden" name="time" value={schedule.time} />
      <div className="flex gap-1">
        <select
          value={schedule.hour}
          onChange={(event) => schedule.set({ hour: event.target.value })}
          className="w-1/3 rounded border p-2"
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <select
          value={schedule.minute}
          onChange={(event) => schedule.set({ minute: event.target.value })}
          className="w-1/3 rounded border p-2"
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={schedule.period}
          onChange={(event) => schedule.set({ period: event.target.value })}
          className="w-1/3 rounded border p-2"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}

export function DurationField({ schedule }: { schedule: Schedule }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">Length</label>
      <select
        name="duration"
        value={schedule.duration}
        onChange={(event) => schedule.set({ duration: Number(event.target.value) })}
        className="w-full rounded border p-2"
      >
        {DURATIONS.map((minutes) => (
          <option key={minutes} value={minutes}>
            {formatDuration(minutes)}
          </option>
        ))}
      </select>
    </div>
  );
}
