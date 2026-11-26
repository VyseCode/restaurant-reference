"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SlotCapacityDTO } from "@/lib/types";

export function SlotCapacityManager({
  date,
  slots,
}: {
  date: string;
  slots: SlotCapacityDTO[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(slots.map((slot) => [slot.time, String(slot.capacity)])),
  );
  const [saved, setSaved] = useState<string>("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function save(time: string) {
    setBusy(time);
    setError("");
    setSaved("");
    try {
      const response = await fetch("/api/admin/reservations/capacity", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          time,
          capacity: Number(values[time]),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not save capacity");
        return;
      }
      setSaved(`${time} capacity saved.`);
      router.refresh();
    } catch {
      setError("Unable to reach the server");
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5">
      <h2 className="mb-1 text-lg font-semibold">Slot capacity · {date}</h2>
      <p className="mb-4 text-xs text-stone-500">
        Changing a capacity never removes existing bookings. Slots with no bookings use the
        default capacity of 2.
      </p>
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {slots.map((slot) => (
          <div key={slot.time} className="rounded-lg bg-stone-50 px-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{slot.time}</span>
              <span className="text-xs text-stone-500">
                {slot.booked} booked · {slot.remaining} left
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={1000}
                value={values[slot.time] ?? String(slot.capacity)}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [slot.time]: event.target.value }))
                }
                aria-label={`Capacity for ${slot.time}`}
                className="w-20 rounded-md border border-stone-300 px-2 py-1 text-sm"
              />
              <button
                type="button"
                onClick={() => save(slot.time)}
                disabled={busy === slot.time}
                className="rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
              >
                {busy === slot.time ? "Saving" : "Save"}
              </button>
            </div>
          </div>
        ))}
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {saved && <p role="status" className="mt-3 text-sm text-emerald-700">{saved}</p>}
    </section>
  );
}
