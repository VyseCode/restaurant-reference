"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OrderLineDTO } from "@/lib/types";

export function ReviewForm({
  orderId,
  items,
  reviewed,
}: {
  orderId: string;
  items: OrderLineDTO[];
  reviewed: boolean;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [itemId, setItemId] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(reviewed);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          rating,
          comment,
          itemId: itemId || null,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not submit your review");
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
        Thanks! Your review for this order has been recorded.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-stone-200 bg-white p-4">
      <h2 className="text-lg font-semibold">Review your order</h2>
      <p className="text-xs text-stone-500">Reviews are available once an order is completed.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="rating" className="mb-1 block text-sm font-medium text-stone-700">Rating</label>
          <select
            id="rating"
            value={rating}
            onChange={(event) => setRating(Number(event.target.value))}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>{value} star{value === 1 ? "" : "s"}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="review-item" className="mb-1 block text-sm font-medium text-stone-700">Dish (optional)</label>
          <select
            id="review-item"
            value={itemId}
            onChange={(event) => setItemId(event.target.value)}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="">Whole order</option>
            {items.map((line) => (
              <option key={line.itemId} value={line.itemId}>{line.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="comment" className="mb-1 block text-sm font-medium text-stone-700">Comment</label>
        <textarea
          id="comment"
          value={comment}
          maxLength={800}
          onChange={(event) => setComment(event.target.value)}
          rows={3}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </div>
      {error && <p role="alert" className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-[#a3421f] px-5 py-2 text-sm font-semibold text-white hover:bg-[#7e3016] disabled:opacity-50"
      >
        {busy ? "Submitting..." : "Submit review"}
      </button>
    </form>
  );
}
