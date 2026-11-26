import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Category } from "@/models/Category";
import { getCategories } from "@/lib/queries";
import { categoryCreateSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const session = await getSession();
    await connectDB();
    return ok({ categories: await getCategories(session?.role !== "admin") });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);
    if (session.role !== "admin") return fail("Admin access required", 403);

    const body = categoryCreateSchema.parse(await readJson(request));
    await connectDB();
    if (
      await Category.exists({ $or: [{ name: body.name }, { slug: body.slug }] })
    ) {
      return fail("A category with that name or slug already exists", 409);
    }
    const category = await Category.create(body);
    return ok({ category: { ...category.toObject(), id: category._id.toString() } }, 201);
  } catch (error) {
    return handleError(error);
  }
}
