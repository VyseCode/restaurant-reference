import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getCart } from "@/lib/queries";
import { CartView } from "@/components/CartView";

export const metadata = { title: "Cart" };

export default async function CartPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  await connectDB();
  const cart = await getCart(session.userId);

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-stone-900">Your cart</h1>
        <p className="text-sm text-stone-500">Review your order before placing it.</p>
      </div>
      <CartView cart={cart} />
    </main>
  );
}
