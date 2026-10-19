"use client";

import { useState, useTransition } from "react";
import { addAvailability as saveAvailability, removeAvailability as deleteAvailability } from "./actions";
import { formatTime, to24Hour } from "@/lib/time";
import { CalendarIcon, PlusIcon } from "../components/icons";
import { Empty, Section } from "../components/ui";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = ["00", "15", "30", "45"];

// Definte the data stored for each component of the availability entry.
type Availability = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
};

export default function AvailabilityForm({ availability }: { availability: Availability[] }) {
  const [day, setDay] = useState("Monday");
  const [startHour, setStartHour] = useState("12");
  const [startMinute, setStartMinute] = useState("00");
  const [startPeriod, setStartPeriod] = useState("PM");
  const [endHour, setEndHour] = useState("1");
  const [endMinute, setEndMinute] = useState("00");
  const [endPeriod, setEndPeriod] = useState("PM");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function addAvailability() {
    setError("");

    const startTime = to24Hour(startHour, startMinute, startPeriod);
    const selectedEnd = to24Hour(endHour, endMinute, endPeriod);
    // An end time of 12:00 AM means midnight at the end of the day.
    const endTime = selectedEnd === "00:00" ? "24:00" : selectedEnd;

    if (!startTime || !endTime) {
      setError("Please select both a start time and an end time.");
      return;
    }

    if (endTime <= startTime) {
      setError(
        startPeriod === "PM" && endPeriod === "AM"
          ? "Availability can't go past midnight. Add the rest as a separate entry for the next day."
          : "End time must be later than start time."
      );
      return;
    }

    startTransition(async () => {
      try {
        const result = await saveAvailability({ day, startTime, endTime });

        if (result.error) {
          setError(result.error);
          return;
        }

        setStartHour("12");
        setStartMinute("00");
        setStartPeriod("PM");

        setEndHour("1");
        setEndMinute("00");
        setEndPeriod("PM");
      } catch {
        setError("Unable to save availability. Please try again.");
      }
    });
  }

  function removeAvailability(id: string) {
    startTransition(() => deleteAvailability(id));
  }

  // Define the UI for the page and allow users to select availability.
  return (
    <>
      <Section side title="Add a time slot" description="Pick a day and the hours you're usually free.">
        <div className="grid gap-4 @lg:grid-cols-2 @4xl:grid-cols-[0.8fr_1fr_1fr]">
          <div className="@lg:col-span-2 @4xl:col-span-1">
            <label className="label">Day</label>
            <select value={day} onChange={(event) => setDay(event.target.value)} className="field">
              {DAYS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          <TimeSelect
            label="Start time"
            hour={startHour}
            minute={startMinute}
            period={startPeriod}
            onHour={setStartHour}
            onMinute={setStartMinute}
            onPeriod={setStartPeriod}
          />

          <TimeSelect
            label="End time"
            hour={endHour}
            minute={endMinute}
            period={endPeriod}
            onHour={setEndHour}
            onMinute={setEndMinute}
            onPeriod={setEndPeriod}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={addAvailability} disabled={pending} className="btn btn-primary">
            <PlusIcon className="size-4" weight="bold" />
            Add time slot
          </button>
          {error && (
            <p role="alert" className="text-sm font-medium text-red-700">
              {error}
            </p>
          )}
        </div>
      </Section>

      <Section
        side
        title="Your availability"
        description="Players see these times when they search."
        count={availability.length}
      >
        {availability.length === 0 ? (
          <Empty>No availability added yet. Add the times you&apos;re free so other players can find you.</Empty>
        ) : (
          <ul className="-my-2 divide-y divide-slate-100">
            {availability.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-2.5">
                <CalendarIcon className="size-5 shrink-0 text-brand-700" />
                <p className="min-w-0 flex-1 text-sm">
                  <span className="font-semibold text-slate-900">{item.day}</span>
                  <span className="ml-2 text-slate-500 tabular-nums">
                    {formatTime(item.startTime)} - {formatTime(item.endTime)}
                  </span>
                </p>
                <button onClick={() => removeAvailability(item.id)} className="btn btn-danger btn-sm">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}

// Hour, minute, and AM/PM dropdowns for one time.
function TimeSelect({
  label,
  hour,
  minute,
  period,
  onHour,
  onMinute,
  onPeriod,
}: {
  label: string;
  hour: string;
  minute: string;
  period: string;
  onHour: (value: string) => void;
  onMinute: (value: string) => void;
  onPeriod: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="grid grid-cols-3 gap-1.5">
        <select aria-label={`${label} hour`} value={hour} onChange={(event) => onHour(event.target.value)} className="field pr-7 pl-3">
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <select aria-label={`${label} minute`} value={minute} onChange={(event) => onMinute(event.target.value)} className="field pr-7 pl-3">
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select aria-label={`${label} AM or PM`} value={period} onChange={(event) => onPeriod(event.target.value)} className="field pr-7 pl-3">
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </fieldset>
  );
}
