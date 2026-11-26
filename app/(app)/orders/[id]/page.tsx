import Link from "next/link";
import { notFound } from "next/navigation";
import { Types } from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { Review } from "@/models/Review";
import { ReviewForm } from "@/components/ReviewForm";

type Props = { params: Promise<{ id: string }> };

const steps = ["placed", "preparing", "ready", "completed"];

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();
  const session = await getSession();
  await connectDB();

  const order = await Order.findById(id).lean();
  if (!order) notFound();
  if (order.user.toString() !== session?.userId && session?.role !== "admin") {
    notFound();
  }
  const reviewed = !!(await Review.exists({ order: id }));

  const items = (order.items ?? []).map((line) => ({
    itemId: line.item.toString(),
    name: line.name,
    price: line.price,
    qty: line.qty,
  }));

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <Link href="/orders" className="text-sm font-medium text-[#a3421f] hover:underline">
        ← Back to orders
      </Link>

      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">Order #{id.slice(-6)}</h1>
            <p className="text-xs text-stone-500">
              Placed {new Date(order.createdAt).toLocaleString()} · {order.type}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
            order.status === "cancelled"
              ? "bg-red-100 text-red-700"
              : order.status === "completed"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
          }`}>
            {order.status}
          </span>
        </div>

        {order.status !== "cancelled" && (
          <ol className="mt-6 flex flex-wrap gap-2">
            {steps.map((step, index) => {
              const reached = steps.indexOf(order.status) >= index;
              return (
                <li
                  key={step}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    reached ? "bg-[#a3421f] text-white" : "bg-stone-100 text-stone-400"
                  }`}
                >
                  {index + 1}. {step}
                </li>
              );
            })}
          </ol>
        )}

        <div className="mt-6 divide-y divide-stone-100">
          {items.map((line) => (
            <div key={line.itemId} className="flex justify-between py-2 text-sm">
              <span>{line.qty} × {line.name}</span>
              <span>₹{line.price * line.qty}</span>
            </div>
          ))}
          <div className="flex justify-between pt-3 text-base font-semibold">
            <span>Total {order.paymentStatus === "paid" ? "(paid)" : "(unpaid)"}</span>
            <span>₹{order.total}</span>
          </div>
        </div>

        {order.type === "delivery" && order.address && (
          <p className="mt-3 text-sm text-stone-600">Deliver to: {order.address}</p>
        )}
        {order.type === "dine-in" && order.tableNumber && (
          <p className="mt-3 text-sm text-stone-600">Table: {order.tableNumber}</p>
        )}
        {order.notes && <p className="mt-2 text-sm text-stone-600">Notes: {order.notes}</p>}
      </div>

      {order.status === "completed" && (
        <ReviewForm orderId={id} items={items} reviewed={reviewed} />
      )}
    </main>
  );
}
