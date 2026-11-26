import { Types } from "mongoose";
import { requireAdmin } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Special } from "@/models/Special";
import { specialUpdateSchema } from "@/lib/schemas";

type Ctx = RouteContext<"/api/specials/[id]">;

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const guard = await requireAdmin();
    if ("response" in guard) return guard.response;

    const { id } = await ctx.params;
    if (!Types.ObjectId.isValid(id)) return fail("Invalid special", 400);
    const body = specialUpdateSchema.parse(await readJson(request));
    await connectDB();

    const special = await Special.findById(id);
    if (!special) return fail("Special not found", 404);
    Object.assign(special, body);
    await special.save();
    return ok({ special: { ...special.toObject(), id: special._id.toString() } });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const guard = await requireAdmin();
    if ("response" in guard) return guard.response;

    const { id } = await ctx.params;
    if (!Types.ObjectId.isValid(id)) return fail("Invalid special", 400);
    await connectDB();
    const special = await Special.findByIdAndDelete(id);
    if (!special) return fail("Special not found", 404);
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
