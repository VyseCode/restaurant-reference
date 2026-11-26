import { Types } from "mongoose";
import { getSession, requireAdmin } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { MenuItem } from "@/models/MenuItem";
import { Favorite } from "@/models/Favorite";
import { Special } from "@/models/Special";
import { getMenuItem } from "@/lib/queries";
import { menuUpdateSchema } from "@/lib/schemas";

type Ctx = RouteContext<"/api/menu/[id]">;

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const session = await getSession();
    const { id } = await ctx.params;
    await connectDB();
    const item = await getMenuItem(id, session?.userId ?? "");
    if (!item) return fail("Menu item not found", 404);
    return ok({ item });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const guard = await requireAdmin();
    if ("response" in guard) return guard.response;

    const { id } = await ctx.params;
    if (!Types.ObjectId.isValid(id)) return fail("Invalid menu item", 400);
    const body = menuUpdateSchema.parse(await readJson(request));
    await connectDB();

    const item = await MenuItem.findById(id);
    if (!item) return fail("Menu item not found", 404);
    Object.assign(item, body);
    await item.save();
    return ok({ item: { ...item.toObject(), id: item._id.toString() } });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const guard = await requireAdmin();
    if ("response" in guard) return guard.response;

    const { id } = await ctx.params;
    if (!Types.ObjectId.isValid(id)) return fail("Invalid menu item", 400);
    await connectDB();

    const item = await MenuItem.findByIdAndDelete(id);
    if (!item) return fail("Menu item not found", 404);
    await Promise.all([
      Favorite.deleteMany({ item: id }),
      Special.deleteMany({ item: id }),
    ]);
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
