"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Result = { error?: string };

export function AddToCartButton({
  itemId,
  available,
}: {
  itemId: string;
  available: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "busy" | "done">("idle");
  const [message, setMessage] = useState("");

  async function add() {
    setStatus("busy");
    setMessage("");
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, qty: 1 }),
      });
      const data = (await response.json()) as Result;
      if (!response.ok) {
        setMessage(data.error ?? "Could not add to cart");
        setStatus("idle");
        return;
      }
      setStatus("done");
      setMessage("Added to cart");
      router.refresh();
    } catch {
      setMessage("Could not add to cart");
      setStatus("idle");
    }
  }

  if (!available) {
    return <span className="text-xs font-medium text-stone-400">Unavailable</span>;
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={add}
        disabled={status === "busy"}
        className="rounded-full bg-[#a3421f] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#7e3016] disabled:opacity-60"
      >
        {status === "done" ? "Add another" : "Add to cart"}
      </button>
      {message && (
        <span className={status === "done" ? "text-[11px] text-emerald-700" : "text-[11px] text-red-700"}>
          {message}
        </span>
      )}
    </span>
  );
}

export function FavoriteButton({
  itemId,
  initial,
}: {
  itemId: string;
  initial: boolean;
}) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      if (response.ok) {
        const data = (await response.json()) as { favorite: boolean };
        setFavorite(data.favorite);
        router.refresh();
      }
    } catch {
      setFavorite(initial);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
      className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm transition disabled:opacity-50 ${
        favorite
          ? "border-rose-300 bg-rose-50 text-rose-600"
          : "border-stone-200 bg-white text-stone-400 hover:text-rose-500"
      }`}
    >
      {favorite ? "♥" : "♡"}
    </button>
  );
}
