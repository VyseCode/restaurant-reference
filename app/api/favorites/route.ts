import { requireUser } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Favorite } from "@/models/Favorite";
import { MenuItem } from "@/models/MenuItem";
import { getFavoriteItems } from "@/lib/queries";
import { favoriteSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const guard = await requireUser();
    if ("response" in guard) return guard.response;
    await connectDB();
    return ok({ items: await getFavoriteItems(guard.session.userId) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const guard = await requireUser();
    if ("response" in guard) return guard.response;
    const body = favoriteSchema.parse(await readJson(request));
    await connectDB();

    if (!(await MenuItem.exists({ _id: body.itemId }))) {
      return fail("Menu item not found", 404);
    }
    const existing = await Favorite.findOne({
      user: guard.session.userId,
      item: body.itemId,
    });
    if (existing) {
      await existing.deleteOne();
      return ok({ favorite: false });
    }
    await Favorite.create({
      user: guard.session.userId,
      item: body.itemId,
    });
    return ok({ favorite: true }, 201);
  } catch (error) {
    return handleError(error);
  }
}
