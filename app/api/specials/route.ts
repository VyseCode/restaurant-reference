import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { MenuItem } from "@/models/MenuItem";
import { Special } from "@/models/Special";
import { getSpecials } from "@/lib/queries";
import { specialCreateSchema } from "@/lib/schemas";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") ?? undefined;
    await connectDB();

    if (session?.role === "admin" && searchParams.get("all") === "true") {
      const docs = await Special.find(date ? { date } : {})
        .populate("item", "name price")
        .sort({ date: 1 })
        .limit(100)
        .lean();
      return ok({ specials: docs });
    }
    return ok({ specials: await getSpecials(date) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);
    if (session.role !== "admin") return fail("Admin access required", 403);

    const body = specialCreateSchema.parse(await readJson(request));
    await connectDB();
    if (!(await MenuItem.exists({ _id: body.item }))) {
      return fail("Menu item not found", 404);
    }
    if (await Special.exists({ date: body.date, item: body.item })) {
      return fail("That item is already a special on this date", 409);
    }
    const special = await Special.create(body);
    return ok({ special: { ...special.toObject(), id: special._id.toString() } }, 201);
  } catch (error) {
    return handleError(error);
  }
}
