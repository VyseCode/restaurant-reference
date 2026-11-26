import { connectDB } from "@/lib/db";
import { getAdminStats } from "@/lib/queries";

export const metadata = { title: "Admin overview" };

export default async function AdminHomePage() {
  await connectDB();
  const stats = await getAdminStats();

  const cards = [
    ["Orders", stats.orders],
    ["Revenue", `₹${stats.revenue}`],
    ["Confirmed bookings", stats.reservations],
    ["Popular item", stats.popularItems[0]?.name ?? "—"],
  ];

  return (
    <main className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="mb-3 text-lg font-semibold">Order status</h2>
          {Object.entries(stats.statusCounts).length === 0 ? (
            <p className="text-sm text-stone-500">No orders yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {Object.entries(stats.statusCounts).map(([status, count]) => (
                <li key={status} className="flex justify-between">
                  <span className="capitalize">{status}</span>
                  <strong>{count}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="mb-3 text-lg font-semibold">Popular items</h2>
          {stats.popularItems.length === 0 ? (
            <p className="text-sm text-stone-500">No item data yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {stats.popularItems.map((item, index) => (
                <li key={item.id} className="flex justify-between">
                  <span>{index + 1}. {item.name}</span>
                  <strong>{item.orders} ordered</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
