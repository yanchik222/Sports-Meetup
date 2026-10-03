"use client";

import { useState, useTransition } from "react";
import { addAvailability as saveAvailability, removeAvailability as deleteAvailability } from "./actions";

// Definte the data stored for each component of the availability entry.
type Availability = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
};

export default function AvailabilityForm({ availability }: { availability: Availability[] }) {
  const [day, setDay] = useState("Monday");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [pending, startTransition] = useTransition();

  function addAvailability() {
    if (!startTime || !endTime) {
      alert("Please enter both a start time and an end time.");
      return;
    }

    startTransition(async () => {
      await saveAvailability({ day, startTime, endTime });
      setStartTime("");
      setEndTime("");
    });
  }

  function removeAvailability(id: string) {
    startTransition(() => deleteAvailability(id));
  }

  // Define the UI for the page and allows users to select availability.
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

            <input
              type="text"
              placeholder="Ex: 1:30pm" 
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className="w-full rounded border p-2"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium">End Time</label>

            <input
              type="text"
              placeholder="Ex: 2:30pm" 
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              className="w-full rounded border p-2"
            />
          </div>

          <button
            onClick={addAvailability}
            disabled={pending}
            className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            Add Availability
          </button>
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
                    {item.day}: {item.startTime} - {item.endTime}
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