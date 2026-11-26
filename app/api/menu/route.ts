import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { MenuItem } from "@/models/MenuItem";
import { getMenuItems } from "@/lib/queries";
import { menuCreateSchema } from "@/lib/schemas";
import { paginationFrom } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const { page, limit } = paginationFrom(searchParams);
    await connectDB();

    const result = await getMenuItems({
      q: searchParams.get("q") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      diet: searchParams.get("diet") ?? undefined,
      available: searchParams.get("available") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      page,
      limit,
      viewerId: session?.userId ?? "",
    });
    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);
    if (session.role !== "admin") return fail("Admin access required", 403);

    const body = menuCreateSchema.parse(await readJson(request));
    await connectDB();
    const item = await MenuItem.create(body);
    return ok({ item: { ...item.toObject(), id: item._id.toString() } }, 201);
  } catch (error) {
    return handleError(error);
  }
}
