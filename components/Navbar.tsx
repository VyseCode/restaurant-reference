"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { PublicUser } from "@/lib/auth";
import {
  CalendarIcon,
  CartIcon,
  ChartIcon,
  MenuIcon,
  ReceiptIcon,
  UserIcon,
} from "@/components/Icons";

const customerLinks = [
  { href: "/menu", label: "Menu", Icon: MenuIcon },
  { href: "/reservations", label: "Reserve", Icon: CalendarIcon },
  { href: "/orders", label: "Orders", Icon: ReceiptIcon },
  { href: "/cart", label: "Cart", Icon: CartIcon },
  { href: "/account", label: "Account", Icon: UserIcon },
];

const adminLinks = [
  { href: "/admin", label: "Overview", Icon: ChartIcon },
  { href: "/admin/orders", label: "Orders", Icon: ReceiptIcon },
  { href: "/admin/reservations", label: "Bookings", Icon: CalendarIcon },
  { href: "/admin/menu", label: "Menu", Icon: MenuIcon },
  { href: "/admin/specials", label: "Specials", Icon: CalendarIcon },
];

export function Navbar({
  user,
  cartCount,
}: {
  user: PublicUser;
  cartCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const links = user.role === "admin" ? adminLinks : customerLinks;

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link href={user.role === "admin" ? "/admin" : "/menu"} className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#a3421f] text-sm font-bold text-white">
            S
          </span>
          <span className="hidden text-sm font-semibold tracking-wide text-stone-800 sm:block">
            SAFFRON &amp; SPICE
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-1 sm:gap-3">
          {links.map(({ href, label, Icon }) => {
            const active = pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex min-w-12 flex-col items-center gap-1 border-b-2 px-2 py-1 text-[11px] transition-colors sm:min-w-16 sm:text-xs ${
                  active
                    ? "border-[#a3421f] text-[#a3421f]"
                    : "border-transparent text-stone-500 hover:text-stone-900"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="hidden sm:inline">{label}</span>
                {label === "Cart" && cartCount > 0 && (
                  <span className="absolute right-0 top-0 rounded-full bg-[#a3421f] px-1.5 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="relative ml-1">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Account menu"
              aria-expanded={menuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-sm font-semibold text-stone-700 hover:bg-stone-200"
            >
              {user.name.charAt(0).toUpperCase()}
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
                <div className="border-b border-stone-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold">{user.name}</p>
                  <p className="truncate text-xs text-stone-500">{user.email}</p>
                  {user.role === "admin" && (
                    <Link
                      href="/menu"
                      onClick={() => setMenuOpen(false)}
                      className="mt-1 inline-block text-xs font-medium text-[#a3421f] hover:underline"
                    >
                      Customer view
                    </Link>
                  )}
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full px-4 py-2.5 text-left text-sm text-stone-600 hover:bg-stone-50"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
