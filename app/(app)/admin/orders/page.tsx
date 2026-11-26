import Link from "next/link";
import { connectDB } from "@/lib/db";
import { getOrders } from "@/lib/queries";
import { OrderActions } from "@/components/OrderActions";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata = { title: "Admin orders" };

export default async function AdminOrdersPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = Array.isArray(params.status) ? params.status[0] : params.status;
  await connectDB();
  const result = await getOrders({ status: status || undefined, limit: 48 });

  return (
    <main className="space-y-4">
      <form action="/admin/orders" method="get" className="flex flex-wrap items-center gap-2">
        <label htmlFor="status" className="text-sm text-stone-600">Filter by status</label>
        <select id="status" name="status" defaultValue={status ?? ""} className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm">
          <option value="">All</option>
          <option value="placed">Placed</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button type="submit" className="rounded-full bg-stone-900 px-4 py-1.5 text-xs font-semibold text-white">Apply</button>
      </form>

      {result.items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center text-sm text-stone-500">
          No orders match this filter.
        </p>
      ) : (
        <div className="space-y-3">
          {result.items.map((order) => (
            <article key={order.id} className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-900">
                    #{order.id.slice(-6)} · {order.userName ?? "Guest"} · {order.type}
                  </p>
                  <p className="text-xs text-stone-500">
                    {new Date(order.createdAt).toLocaleString()} · {order.status} · {order.paymentStatus}
                  </p>
                  <p className="mt-1 text-xs text-stone-600">
                    {order.items.map((line) => `${line.qty}× ${line.name}`).join(", ")}
                  </p>
                </div>
                <div className="text-right">
                  <strong className="text-lg">₹{order.total}</strong>
                  <Link href={`/orders/${order.id}`} className="ml-3 text-xs text-[#a3421f] hover:underline">View</Link>
                </div>
              </div>
              <div className="mt-3 border-t border-stone-100 pt-3">
                <OrderActions order={order} />
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
