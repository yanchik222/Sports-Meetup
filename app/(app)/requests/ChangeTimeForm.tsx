"use client";

import { useActionState, useState } from "react";
import { proposeNewTime, type RequestFormState } from "./actions";
import { DateField, DurationField, TimeField, useSchedule } from "../components/ScheduleFields";

// A collapsible form for editing a request's time or suggesting a new one.
export default function ChangeTimeForm({
  id,
  current,
  label,
  submitLabel,
}: {
  id: string;
  current: { date: string; time: string; duration: number; location: string };
  label: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<RequestFormState, FormData>(proposeNewTime, {});
  const schedule = useSchedule(current);
  const [location, setLocation] = useState(current.location);

  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-sm font-medium text-blue-600">{label}</summary>

      <form action={formAction} className="mt-2 grid grid-cols-2 gap-3">
        <input type="hidden" name="id" value={id} />

        <DateField schedule={schedule} />
        <TimeField schedule={schedule} />
        <DurationField schedule={schedule} />

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

        {state.error && (
          <p aria-live="polite" className="col-span-2 text-sm text-red-600">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="col-span-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Sending…" : submitLabel}
        </button>
      </form>
    </details>
  );
}
