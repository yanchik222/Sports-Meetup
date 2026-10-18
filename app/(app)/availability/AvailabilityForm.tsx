"use client";

import { useState, useTransition } from "react";
import { addAvailability as saveAvailability, removeAvailability as deleteAvailability } from "./actions";
import { formatTime, to24Hour } from "@/lib/time";

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
    <main className="flex-1 p-8 text-black">
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow">
        <h1 className="mb-2 text-3xl font-bold">Sports Meetup</h1>  

        <h2 className="mb-6 text-xl font-semibold"> 
          Player Availability 
        </h2>

        <div className="mb-6 space-y-4">
          <div>
            <label className="mb-1 block font-medium">Day</label>

            <select
              value={day}
              onChange={(event) => setDay(event.target.value)}
              className="w-full rounded border p-2"
            >
              <option>Monday</option>
              <option>Tuesday</option>
              <option>Wednesday</option>
              <option>Thursday</option>
              <option>Friday</option>
              <option>Saturday</option>
              <option>Sunday</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block font-medium">Start Time</label>

            <div className="flex gap-2">
              <select
                value={startHour}
                onChange={(event) => setStartHour(event.target.value)}
                className="w-1/3 rounded border p-2"
              >
                {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((hour) => (
                  <option key={hour} value={hour}>{hour}</option>
                ))}
              </select>

              <select
                value={startMinute}
                onChange={(event) => setStartMinute(event.target.value)}
                className="w-1/3 rounded border p-2"
              >
                {["00", "15", "30", "45"].map((minute) => (
                  <option key={minute} value={minute}>{minute}</option>
                ))}
              </select>

              <select
                value={startPeriod}
                onChange={(event) => setStartPeriod(event.target.value)}
                className="w-1/3 rounded border p-2"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block font-medium">End Time</label>

            <div className="flex gap-2">
              <select
                value={endHour}
                onChange={(event) => setEndHour(event.target.value)}
                className="w-1/3 rounded border p-2"
              >
                {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((hour) => (
                  <option key={hour} value={hour}>{hour}</option>
                ))}
              </select>

              <select
                value={endMinute}
                onChange={(event) => setEndMinute(event.target.value)}
                className="w-1/3 rounded border p-2"
              >
                {["00", "15", "30", "45"].map((minute) => (
                  <option key={minute} value={minute}>{minute}</option>
                ))}
              </select>

              <select
                value={endPeriod}
                onChange={(event) => setEndPeriod(event.target.value)}
                className="w-1/3 rounded border p-2"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          <button
            onClick={addAvailability}
            disabled={pending}
            className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            Add Availability
          </button>
          {error && (
            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold">
            Current Availability
          </h3>

          {availability.length === 0 ? (
            <p className="text-gray-500">
              No availability added yet.
            </p>
          ) : (
            <div className="space-y-2">
              {availability.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded border p-3"
                >
                  <span>
                    {item.day}: {formatTime(item.startTime)} - {formatTime(item.endTime)}
                  </span>

                  <button
                    onClick={() => removeAvailability(item.id)}
                    className="text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}