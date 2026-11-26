import { Types } from "mongoose";
import { requireUser } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Cart } from "@/models/Cart";
import { getCart } from "@/lib/queries";

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/cart/[itemId]">,
) {
  try {
    const guard = await requireUser();
    if ("response" in guard) return guard.response;

    const { itemId } = await ctx.params;
    if (!Types.ObjectId.isValid(itemId)) return fail("Invalid item", 400);
    await connectDB();

    const cart = await Cart.findOne({ user: guard.session.userId });
    if (!cart) return fail("Item is not in your cart", 404);
    const before = cart.items.length;
    cart.items = cart.items.filter(
      (line) => line.item.toString() !== itemId,
    ) as typeof cart.items;
    if (cart.items.length === before) {
      return fail("Item is not in your cart", 404);
    }
    await cart.save();
    return ok({ cart: await getCart(guard.session.userId) });
  } catch (error) {
    return handleError(error);
  }
}
