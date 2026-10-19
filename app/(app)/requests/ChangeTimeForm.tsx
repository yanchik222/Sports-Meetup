"use client";

import { useActionState, useState } from "react";
import { proposeNewTime, type RequestFormState } from "./actions";
import { DateField, DurationField, TimeField, useSchedule } from "../components/ScheduleFields";
import { ChevronIcon } from "../components/icons";

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
    <details className="group">
      <summary className="disclosure">
        <ChevronIcon className="size-4 transition group-open:rotate-90" />
        {label}
      </summary>

      <form
        action={formAction}
        className="mt-3 grid gap-4 rounded-xl bg-slate-50 p-4 @lg:grid-cols-2"
      >
        <input type="hidden" name="id" value={id} />

        <DateField schedule={schedule} />
        <TimeField schedule={schedule} />
        <DurationField schedule={schedule} />

        <div>
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

        {state.error && (
          <p aria-live="polite" className="text-sm font-medium text-red-700 @lg:col-span-2">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary @lg:col-span-2 @lg:justify-self-start"
        >
          {pending ? "Sending…" : submitLabel}
        </button>
      </form>
    </details>
  );
}
