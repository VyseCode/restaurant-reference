"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { NEXT_ORDER_STATUS } from "@/lib/constants";
import type { OrderDTO } from "@/lib/types";

export function OrderActions({ order }: { order: OrderDTO }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const next = NEXT_ORDER_STATUS[order.status] ?? null;

  async function update(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? "Could not update order");
        return;
      }
      router.refresh();
    } catch {
      setError("Unable to reach the server");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {next && (
        <button
          type="button"
          disabled={busy}
          onClick={() => update({ status: next })}
          className="rounded-full bg-[#a3421f] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          Move to {next}
        </button>
      )}
      {["placed", "preparing", "ready"].includes(order.status) && (
        <button
          type="button"
          disabled={busy}
          onClick={() => update({ status: "cancelled" })}
          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          Cancel
        </button>
      )}
      {order.paymentStatus === "unpaid" && order.status !== "cancelled" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => update({ status: order.status, paymentStatus: "paid" })}
          className="rounded-md border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
        >
          Mark paid
        </button>
      )}
      {error && <span className="text-[11px] text-red-700">{error}</span>}
    </span>
  );
}
