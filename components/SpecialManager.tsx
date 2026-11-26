"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MenuItemDTO, SpecialDTO } from "@/lib/types";
import { ActionButton } from "@/components/ActionButton";

export function SpecialManager({
  items,
  specials,
  today,
}: {
  items: MenuItemDTO[];
  specials: SpecialDTO[];
  today: string;
}) {
  const router = useRouter();
  const [date, setDate] = useState(today);
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/specials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          item: itemId,
          specialPrice: Number(price),
          note,
          available: true,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not add special");
        return;
      }
      setMessage("Special added.");
      setPrice("");
      setNote("");
      router.refresh();
    } catch {
      setError("Unable to reach the server");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="grid gap-3 rounded-xl border border-stone-200 bg-white p-5 sm:grid-cols-4">
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Date" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <select value={itemId} onChange={(event) => setItemId(event.target.value)} aria-label="Item" className="rounded-md border border-stone-300 px-3 py-2 text-sm">
          {items.map((item) => <option key={item.id} value={item.id}>{item.name} (₹{item.price})</option>)}
        </select>
        <input type="number" min="1" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Special price" required className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Note" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <button type="submit" disabled={busy || !items.length} className="rounded-full bg-[#a3421f] px-5 py-2 text-xs font-semibold text-white disabled:opacity-50 sm:col-span-4">Add special</button>
        {error && <p role="alert" className="text-sm text-red-700 sm:col-span-4">{error}</p>}
        {message && <p role="status" className="text-sm text-emerald-700 sm:col-span-4">{message}</p>}
      </form>

      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold">Upcoming specials ({specials.length})</h2>
        {specials.length === 0 ? (
          <p className="text-sm text-stone-500">No specials scheduled.</p>
        ) : (
          <div className="space-y-2">
            {specials.map((special) => (
              <div key={special.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-stone-50 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{special.date} · {special.itemName} · ₹{special.price}</p>
                  <p className="text-xs text-stone-500">{special.note || "No note"} · {special.available ? "visible" : "hidden"}</p>
                </div>
                <div className="flex gap-2">
                  <ActionButton
                    label={special.available ? "Hide" : "Show"}
                    url={`/api/specials/${special.id}`}
                    method="PATCH"
                    body={{ available: !special.available }}
                  />
                  <ActionButton
                    label="Delete"
                    url={`/api/specials/${special.id}`}
                    method="DELETE"
                    confirm="Delete this special?"
                    className="text-red-700 hover:underline"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
