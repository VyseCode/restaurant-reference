import Link from "next/link";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getMenuItems, getSpecials } from "@/lib/queries";
import { StarIcon } from "@/components/Icons";

export default async function HomePage() {
  const session = await getSession();
  await connectDB();
  const [special, popular] = await Promise.all([
    getSpecials(),
    getMenuItems({ sort: "popular", limit: 6 }),
  ]);

  return (
    <main className="min-h-screen bg-[#faf7f2]">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#a3421f] text-sm font-bold text-white">S</span>
          <span className="text-sm font-semibold tracking-wide text-stone-800">SAFFRON &amp; SPICE</span>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/menu" className="rounded-full px-4 py-2 font-medium text-stone-700 hover:bg-white">Menu</Link>
          {session ? (
            <Link href={session.role === "admin" ? "/admin" : "/menu"} className="rounded-full bg-[#a3421f] px-4 py-2 font-semibold text-white hover:bg-[#7e3016]">
              {session.role === "admin" ? "Admin area" : "Order now"}
            </Link>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-4 py-2 font-medium text-stone-700 hover:bg-white">Sign in</Link>
              <Link href="/register" className="rounded-full bg-[#a3421f] px-4 py-2 font-semibold text-white hover:bg-[#7e3016]">Create account</Link>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a3421f]">Neighborhood kitchen</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-stone-900 sm:text-6xl">
              Good food,<br />made fresh daily.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-stone-600">
              Explore our menu, book a table, and order online for dine-in, takeaway or delivery.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/menu" className="rounded-full bg-[#a3421f] px-6 py-3 text-sm font-semibold text-white hover:bg-[#7e3016]">Explore the menu</Link>
              <Link href="/reservations" className="rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-800 hover:border-[#a3421f]">Reserve a table</Link>
            </div>
            {special[0] && (
              <p className="mt-6 inline-block rounded-lg border border-[#e2b98c] bg-[#fff4e4] px-4 py-2 text-sm text-[#7e3016]">
                Today&apos;s special: <strong>{special[0].itemName}</strong> at ₹{special[0].price} (regular ₹{special[0].regularPrice})
              </p>
            )}
          </div>
          <div className="relative flex h-72 items-center justify-center rounded-3xl bg-gradient-to-br from-[#e9c99f] via-[#f6e2c6] to-[#d99b6c] sm:h-96">
            <span className="text-8xl font-bold text-white/80">S&amp;S</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-2xl font-semibold text-stone-900">Guest favorites</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popular.items.map((item) => (
            <Link key={item.id} href={`/menu/${item.id}`} className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4 transition hover:shadow-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#a3421f]">{item.categoryName}</p>
                <p className="font-semibold text-stone-900">{item.name}</p>
                {item.reviewCount > 0 && (
                  <p className="flex items-center gap-1 text-xs text-stone-500">
                    <StarIcon className="h-3 w-3 text-amber-500" /> {item.rating} ({item.reviewCount})
                  </p>
                )}
              </div>
              <strong className="text-stone-900">₹{item.price}</strong>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
