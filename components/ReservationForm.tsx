"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SLOTS } from "@/lib/constants";

type Result = { error?: string };

export function ReservationForm({
  date,
  availability,
  booked,
}: {
  date: string;
  availability: Record<string, number>;
  booked: string[];
}) {
  const router = useRouter();
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time, partySize, notes }),
      });
      const data = (await response.json()) as Result;
      if (!response.ok) {
        setError(data.error ?? "Could not book this table");
        return;
      }
      setSuccess("Table booked! You can manage it below.");
      setTime("");
      setNotes("");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-stone-200 bg-white p-5">
      <div>
        <label htmlFor="date" className="mb-1 block text-sm font-medium text-stone-700">
          Date
        </label>
        <input
          id="date"
          type="date"
          value={date}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(event) => {
            router.push(`/reservations?date=${event.target.value}`);
          }}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-stone-700">Available times</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {SLOTS.map((slot) => {
            const full = (availability[slot] ?? 0) <= 0;
            const alreadyBooked = booked.includes(slot);
            const disabled = full || alreadyBooked;
            return (
              <button
                key={slot}
                type="button"
                disabled={disabled}
                onClick={() => setTime(slot)}
                className={`rounded-md border px-2 py-2 text-xs font-medium transition ${
                  time === slot
                    ? "border-[#a3421f] bg-[#a3421f] text-white"
                    : disabled
                      ? "cursor-not-allowed border-stone-200 bg-stone-50 text-stone-400 line-through"
                      : "border-stone-300 bg-white text-stone-700 hover:border-[#a3421f]"
                }`}
                title={alreadyBooked ? "You already have a booking" : full ? "Fully booked" : `${availability[slot]} tables left`}
              >
                {slot}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-stone-500">
          Each slot has a limited number of tables. Select a time to continue.
        </p>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="party" className="mb-1 block text-sm font-medium text-stone-700">
            Guests
          </label>
          <input
            id="party"
            type="number"
            min={1}
            max={12}
            value={partySize}
            onChange={(event) => setPartySize(Number(event.target.value))}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="notes" className="mb-1 block text-sm font-medium text-stone-700">
            Notes (optional)
          </label>
          <input
            id="notes"
            value={notes}
            maxLength={300}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Celebration, seating preference..."
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {error && <p role="alert" className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      {success && <p role="status" className="rounded-md bg-emerald-50 p-2 text-sm text-emerald-700">{success}</p>}

      <button
        type="submit"
        disabled={!time || busy}
        className="rounded-full bg-[#a3421f] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7e3016] disabled:opacity-50"
      >
        {busy ? "Booking..." : "Reserve table"}
      </button>
    </form>
  );
}
