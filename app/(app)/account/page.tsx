import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getFavoriteItems, getOrders, getReservations } from "@/lib/queries";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  await connectDB();

  const [user, favorites, orders, reservations] = await Promise.all([
    User.findById(session.userId).select("name email role createdAt"),
    getFavoriteItems(session.userId),
    getOrders({ userId: session.userId, limit: 5 }),
    getReservations({ userId: session.userId, limit: 5 }),
  ]);

  return (
    <main className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f6e2c6] text-xl font-semibold text-[#a3421f]">
            {user?.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">{user?.name}</h1>
            <p className="text-sm text-stone-500">{user?.email}</p>
            <p className="text-xs text-stone-400">
              Member since {user ? new Date(user.createdAt).toLocaleDateString() : "—"} · {user?.role}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="mb-3 text-lg font-semibold">Favorites</h2>
          {favorites.length === 0 ? (
            <p className="text-sm text-stone-500">No favorites yet. Tap the heart on a dish.</p>
          ) : (
            <ul className="space-y-2">
              {favorites.map((item) => (
                <li key={item.id}>
                  <Link href={`/menu/${item.id}`} className="flex justify-between text-sm hover:text-[#a3421f]">
                    <span>{item.name}</span>
                    <span className="text-stone-500">₹{item.price}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="mb-3 text-lg font-semibold">Quick links</h2>
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/orders" className="text-[#a3421f] hover:underline">View all orders ({orders.pagination.total})</Link>
            <Link href="/reservations" className="text-[#a3421f] hover:underline">Manage reservations ({reservations.pagination.total})</Link>
            <Link href="/menu" className="text-[#a3421f] hover:underline">Browse the menu</Link>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold">Recent orders</h2>
        {orders.items.length === 0 ? (
          <p className="text-sm text-stone-500">No orders yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {orders.items.map((order) => (
              <li key={order.id} className="flex justify-between">
                <Link href={`/orders/${order.id}`} className="hover:text-[#a3421f]">
                  #{order.id.slice(-6)} · {order.items.length} dishes
                </Link>
                <span className="text-stone-500">{order.status} · ₹{order.total}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
