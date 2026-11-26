import { Types } from "mongoose";
import { requireUser } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Cart } from "@/models/Cart";
import { MenuItem } from "@/models/MenuItem";
import { getCart } from "@/lib/queries";
import { cartAddSchema, cartUpdateSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const guard = await requireUser();
    if ("response" in guard) return guard.response;
    const body = cartAddSchema.parse(await readJson(request));
    await connectDB();

    const item = await MenuItem.findById(body.itemId).select("available");
    if (!item) return fail("Menu item not found", 404);
    if (!item.available) return fail("This item is currently unavailable", 409);

    let cart = await Cart.findOne({ user: guard.session.userId });
    if (!cart) {
      cart = await Cart.create({
        user: guard.session.userId,
        items: [{ item: body.itemId, qty: body.qty }],
      });
    } else {
      const line = cart.items.find(
        (entry) => entry.item.toString() === body.itemId,
      );
      if (line) {
        line.qty = Math.min(50, line.qty + body.qty);
      } else {
        cart.items.push({
          _id: new Types.ObjectId(),
          item: new Types.ObjectId(body.itemId),
          qty: body.qty,
        });
      }
      await cart.save();
    }
    return ok({ cart: await getCart(guard.session.userId) }, 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const guard = await requireUser();
    if ("response" in guard) return guard.response;
    const body = cartUpdateSchema.parse(await readJson(request));
    await connectDB();

    const cart = await Cart.findOne({ user: guard.session.userId });
    const line = cart?.items.find(
      (entry) => entry.item.toString() === body.itemId,
    );
    if (!cart || !line) return fail("Item is not in your cart", 404);
    line.qty = body.qty;
    await cart.save();
    return ok({ cart: await getCart(guard.session.userId) });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE() {
  try {
    const guard = await requireUser();
    if ("response" in guard) return guard.response;
    await connectDB();
    await Cart.findOneAndUpdate(
      { user: guard.session.userId },
      { $set: { items: [] } },
    );
    return ok({ cart: await getCart(guard.session.userId) });
  } catch (error) {
    return handleError(error);
  }
}
