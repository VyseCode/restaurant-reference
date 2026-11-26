import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (session?.role !== "admin") redirect("/menu");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Restaurant admin</h1>
        <p className="text-sm text-stone-500">Manage orders, bookings and your menu.</p>
      </div>
      <nav className="flex flex-wrap gap-2 border-b border-stone-200 pb-2 text-sm">
        {[
          ["/admin", "Overview"],
          ["/admin/orders", "Orders"],
          ["/admin/reservations", "Reservations"],
          ["/admin/menu", "Menu"],
          ["/admin/specials", "Specials"],
        ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="rounded-full bg-white px-3 py-1.5 font-medium text-stone-600 ring-1 ring-stone-200 hover:text-[#a3421f]"
          >
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
