import { Types } from "mongoose";
import { requireAdmin } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Category } from "@/models/Category";
import { MenuItem } from "@/models/MenuItem";
import { categoryUpdateSchema } from "@/lib/schemas";

type Ctx = RouteContext<"/api/categories/[id]">;

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const guard = await requireAdmin();
    if ("response" in guard) return guard.response;

    const { id } = await ctx.params;
    if (!Types.ObjectId.isValid(id)) return fail("Invalid category", 400);
    const body = categoryUpdateSchema.parse(await readJson(request));
    await connectDB();

    const category = await Category.findById(id);
    if (!category) return fail("Category not found", 404);
    Object.assign(category, body);
    await category.save();
    return ok({ category: { ...category.toObject(), id: category._id.toString() } });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const guard = await requireAdmin();
    if ("response" in guard) return guard.response;

    const { id } = await ctx.params;
    if (!Types.ObjectId.isValid(id)) return fail("Invalid category", 400);
    await connectDB();

    if (await MenuItem.exists({ category: id })) {
      return fail("Remove the items in this category first", 409);
    }
    const category = await Category.findByIdAndDelete(id);
    if (!category) return fail("Category not found", 404);
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
