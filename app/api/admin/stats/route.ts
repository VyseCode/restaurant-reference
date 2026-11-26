import { requireAdmin } from "@/lib/auth";
import { handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { getAdminStats } from "@/lib/queries";

export async function GET() {
  try {
    const guard = await requireAdmin();
    if ("response" in guard) return guard.response;
    await connectDB();
    return ok({ stats: await getAdminStats() });
  } catch (error) {
    return handleError(error);
  }
}
