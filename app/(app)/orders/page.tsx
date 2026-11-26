import Link from "next/link";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getOrders } from "@/lib/queries";

export const metadata = { title: "Orders" };

const badges: Record<string, string> = {
  placed: "bg-amber-100 text-amber-800",
  preparing: "bg-blue-100 text-blue-800",
  ready: "bg-emerald-100 text-emerald-800",
  completed: "bg-stone-200 text-stone-700",
  cancelled: "bg-red-100 text-red-700",
};

export default async function OrdersPage() {
  const session = await getSession();
  await connectDB();
  const result = await getOrders({ userId: session?.userId ?? "", limit: 50 });

  return (
    <main className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-stone-900">Order history</h1>
        <p className="text-sm text-stone-500">Track your past and current orders.</p>
      </div>

      {result.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <p className="font-medium">No orders yet</p>
          <Link href="/menu" className="mt-2 inline-block text-sm font-semibold text-[#a3421f] hover:underline">
            Browse the menu
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {result.items.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-xl border border-stone-200 bg-white p-4 transition hover:border-[#a3421f] hover:shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-900">
                    Order #{order.id.slice(-6)} · {order.type}
                  </p>
                  <p className="text-xs text-stone-500">
                    {new Date(order.createdAt).toLocaleString()} · {order.items.reduce((sum, line) => sum + line.qty, 0)} items
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badges[order.status] ?? "bg-stone-100"}`}>
                    {order.status}
                  </span>
                  <strong className="text-stone-900">₹{order.total}</strong>
                </div>
              </div>
              <p className="mt-2 truncate text-xs text-stone-500">
                {order.items.map((line) => `${line.qty}× ${line.name}`).join(", ")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
