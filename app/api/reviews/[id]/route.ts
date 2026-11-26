import { Types } from "mongoose";
import { requireUser } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Review } from "@/models/Review";

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/reviews/[id]">,
) {
  try {
    const guard = await requireUser();
    if ("response" in guard) return guard.response;
    const { id } = await ctx.params;
    if (!Types.ObjectId.isValid(id)) return fail("Invalid review", 400);
    await connectDB();

    const review = await Review.findById(id);
    if (!review) return fail("Review not found", 404);
    if (
      review.user.toString() !== guard.session.userId &&
      guard.session.role !== "admin"
    ) {
      return fail("Not allowed", 403);
    }
    await review.deleteOne();
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
