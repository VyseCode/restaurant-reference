"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CartDTO } from "@/lib/types";
import { ActionButton } from "@/components/ActionButton";

export function CartView({ cart }: { cart: CartDTO }) {
  const router = useRouter();
  const [type, setType] = useState<"dine-in" | "takeaway" | "delivery">("takeaway");
  const [address, setAddress] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function checkout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, address, tableNumber, notes }),
      });
      const data = (await response.json()) as {
        error?: string;
        order?: { id: string };
      };
      if (!response.ok || !data.order) {
        setError(data.error ?? "Could not place your order");
        return;
      }
      router.push(`/orders/${data.order.id}`);
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your items ({cart.count})</h2>
          {cart.items.length > 0 && (
            <ActionButton
              label="Clear cart"
              url="/api/cart"
              method="DELETE"
              confirm="Remove everything from your cart?"
              className="text-xs font-medium text-red-700 hover:underline"
            />
          )}
        </div>

        {cart.items.length === 0 ? (
          <p className="py-12 text-center text-sm text-stone-500">
            Your cart is empty. Browse the menu to add something delicious.
          </p>
        ) : (
          <div className="divide-y divide-stone-100">
            {cart.items.map((line) => (
              <div key={line.itemId} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-stone-900">{line.name}</p>
                  <p className="text-xs text-stone-500">₹{line.price} each · ₹{line.lineTotal}</p>
                  {!line.available && (
                    <p className="text-xs font-medium text-red-700">Unavailable — remove to continue</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <ActionButton
                    label="−"
                    url="/api/cart"
                    method="PATCH"
                    body={{ itemId: line.itemId, qty: Math.max(1, line.qty - 1) }}
                    className="h-7 w-7 rounded border border-stone-300 text-sm"
                  />
                  <span className="w-5 text-center text-sm font-medium">{line.qty}</span>
                  <ActionButton
                    label="+"
                    url="/api/cart"
                    method="PATCH"
                    body={{ itemId: line.itemId, qty: Math.min(50, line.qty + 1) }}
                    className="h-7 w-7 rounded border border-stone-300 text-sm"
                  />
                  <ActionButton
                    label="Remove"
                    url={`/api/cart/${line.itemId}`}
                    method="DELETE"
                    className="ml-1 text-xs text-red-700 hover:underline"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <form onSubmit={checkout} className="h-fit space-y-4 rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Checkout</h2>
        <div>
          <label htmlFor="type" className="mb-1 block text-sm font-medium text-stone-700">Order type</label>
          <select
            id="type"
            value={type}
            onChange={(event) => setType(event.target.value as typeof type)}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="dine-in">Dine in</option>
            <option value="takeaway">Takeaway</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>
        {type === "delivery" && (
          <div>
            <label htmlFor="address" className="mb-1 block text-sm font-medium text-stone-700">Delivery address</label>
            <input
              id="address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
        )}
        {type === "dine-in" && (
          <div>
            <label htmlFor="table" className="mb-1 block text-sm font-medium text-stone-700">Table number</label>
            <input
              id="table"
              value={tableNumber}
              onChange={(event) => setTableNumber(event.target.value)}
              placeholder="e.g. T4"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
        )}
        <div>
          <label htmlFor="notes" className="mb-1 block text-sm font-medium text-stone-700">Notes (optional)</label>
          <textarea
            id="notes"
            value={notes}
            maxLength={300}
            onChange={(event) => setNotes(event.target.value)}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            rows={2}
          />
        </div>
        <div className="flex items-center justify-between border-t border-stone-200 pt-3">
          <span className="text-sm text-stone-600">Total</span>
          <strong className="text-xl text-stone-900">₹{cart.total}</strong>
        </div>
        {error && <p role="alert" className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={cart.items.length === 0 || cart.items.some((line) => !line.available) || busy}
          className="w-full rounded-full bg-[#a3421f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7e3016] disabled:opacity-50"
        >
          {busy ? "Placing order..." : "Place order"}
        </button>
      </form>
    </div>
  );
}
