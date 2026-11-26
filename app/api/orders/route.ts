import { Types } from "mongoose";
import { requireUser } from "@/lib/auth";
import { fail, handleError, ok, readJson, paginationFrom } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Cart } from "@/models/Cart";
import { Order } from "@/models/Order";
import { MenuItem } from "@/models/MenuItem";
import { getOrders } from "@/lib/queries";
import { checkoutSchema } from "@/lib/schemas";

export async function GET(request: Request) {
  try {
    const guard = await requireUser();
    if ("response" in guard) return guard.response;
    const { searchParams } = new URL(request.url);
    const { page, limit } = paginationFrom(searchParams);
    const all = guard.session.role === "admin" && searchParams.get("all") === "true";
    await connectDB();

    return ok(
      await getOrders({
        userId: all ? undefined : guard.session.userId,
        status: searchParams.get("status") ?? undefined,
        page,
        limit,
      }),
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const guard = await requireUser();
    if ("response" in guard) return guard.response;
    const body = checkoutSchema.parse(await readJson(request));
    await connectDB();

    const cart = (await Cart.findOne({ user: guard.session.userId }).populate(
      "items.item",
      "name price available",
    ).lean()) as unknown as {
      items: Array<{
        item: { _id: Types.ObjectId; name: string; price: number; available: boolean } | null;
        qty: number;
      }>;
    } | null;

    const lines = cart?.items ?? [];
    if (!lines.length) return fail("Your cart is empty", 400);
    if (lines.some((line) => !line.item || !line.item.available)) {
      return fail("An item in your cart is no longer available", 409);
    }

    const items = lines.map((line) => ({
      item: line.item!._id,
      name: line.item!.name,
      price: line.item!.price,
      qty: line.qty,
    }));
    const total = items.reduce((sum, line) => sum + line.price * line.qty, 0);

    const order = await Order.create({
      user: guard.session.userId,
      items,
      type: body.type,
      status: "placed",
      paymentStatus: "unpaid",
      total,
      address: body.address,
      tableNumber: body.tableNumber,
      notes: body.notes,
    });
    await Cart.updateOne(
      { user: guard.session.userId },
      { $set: { items: [] } },
    );
    await Promise.all(
      items.map((line) =>
        MenuItem.updateOne(
          { _id: line.item },
          { $inc: { popularity: line.qty } },
        ),
      ),
    );

    return ok({ order: { ...order.toObject(), id: order._id.toString() } }, 201);
  } catch (error) {
    return handleError(error);
  }
}
