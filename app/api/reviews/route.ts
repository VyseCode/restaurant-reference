import { requireUser } from "@/lib/auth";
import { fail, handleError, ok, readJson, paginationFrom } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { Review } from "@/models/Review";
import { getReviews } from "@/lib/queries";
import { reviewCreateSchema } from "@/lib/schemas";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit } = paginationFrom(searchParams);
    await connectDB();
    return ok(
      await getReviews({
        itemId: searchParams.get("itemId") ?? undefined,
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
    const body = reviewCreateSchema.parse(await readJson(request));
    await connectDB();

    const order = await Order.findById(body.orderId);
    if (!order) return fail("Order not found", 404);
    if (order.user.toString() !== guard.session.userId) {
      return fail("You can only review your own orders", 403);
    }
    if (order.status !== "completed") {
      return fail("You can only review a completed order", 409);
    }
    if (await Review.exists({ order: body.orderId })) {
      return fail("You already reviewed this order", 409);
    }
    if (
      body.itemId &&
      !order.items.some((line) => line.item.toString() === body.itemId)
    ) {
      return fail("That item is not part of this order", 400);
    }

    const review = await Review.create({
      user: guard.session.userId,
      order: body.orderId,
      item: body.itemId ?? null,
      rating: body.rating,
      comment: body.comment,
    });
    return ok({ review: { ...review.toObject(), id: review._id.toString() } }, 201);
  } catch (error) {
    return handleError(error);
  }
}
