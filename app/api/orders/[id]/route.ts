import { Types } from "mongoose";
import { requireAdmin, requireUser } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { Review } from "@/models/Review";
import { User } from "@/models/User";
import { NEXT_ORDER_STATUS } from "@/lib/constants";
import { orderStatusSchema } from "@/lib/schemas";

type Ctx = RouteContext<"/api/orders/[id]">;

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const guard = await requireUser();
    if ("response" in guard) return guard.response;
    const { id } = await ctx.params;
    if (!Types.ObjectId.isValid(id)) return fail("Invalid order", 400);
    await connectDB();

    const order = await Order.findById(id);
    if (!order) return fail("Order not found", 404);
    if (
      guard.session.role !== "admin" &&
      order.user.toString() !== guard.session.userId
    ) {
      return fail("Not allowed", 403);
    }
    const [user, reviewed] = await Promise.all([
      User.findById(order.user).select("name").lean(),
      Review.exists({ order: id }),
    ]);
    return ok({
      order: {
        ...order.toObject(),
        id: order._id.toString(),
        userName: user?.name,
        reviewed: !!reviewed,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const guard = await requireAdmin();
    if ("response" in guard) return guard.response;
    const { id } = await ctx.params;
    if (!Types.ObjectId.isValid(id)) return fail("Invalid order", 400);
    const body = orderStatusSchema.parse(await readJson(request));
    await connectDB();

    const order = await Order.findById(id);
    if (!order) return fail("Order not found", 404);

    if (body.status !== order.status) {
      if (body.status === "cancelled") {
        if (!["placed", "preparing", "ready"].includes(order.status)) {
          return fail("This order can no longer be cancelled", 400);
        }
      } else if (NEXT_ORDER_STATUS[order.status] !== body.status) {
        return fail("Invalid status transition", 400);
      }
      order.status = body.status;
    } else if (!body.paymentStatus) {
      return fail("Nothing to update", 400);
    }

    if (body.paymentStatus) {
      order.paymentStatus = body.paymentStatus;
    }
    await order.save();
    return ok({ order: { ...order.toObject(), id: order._id.toString() } });
  } catch (error) {
    return handleError(error);
  }
}
