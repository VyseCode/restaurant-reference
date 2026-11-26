import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Types } from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Cart } from "@/models/Cart";
import { Navbar } from "@/components/Navbar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || !Types.ObjectId.isValid(session.userId)) redirect("/login");

  await connectDB();
  const user = await User.findById(session.userId).select("name email role avatarUrl");
  if (!user) redirect("/login");

  const cart = await Cart.findOne({ user: user._id }).select("items").lean();
  const cartCount = (cart?.items ?? []).reduce((sum, line) => sum + line.qty, 0);

  return (
    <div className="min-h-screen">
      <Navbar
        cartCount={cartCount}
        user={{
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl ?? "",
        }}
      />
      <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
    </div>
  );
}
