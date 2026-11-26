import { requireAdmin } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { isValidDateString } from "@/lib/constants";
import { getSlotCapacities, setSlotCapacity } from "@/lib/slot-capacity";
import { slotCapacitySchema } from "@/lib/schemas";

export async function GET(request: Request) {
  try {
    const guard = await requireAdmin();
    if ("response" in guard) return guard.response;
    const date = new URL(request.url).searchParams.get("date") ?? "";
    if (!isValidDateString(date)) return fail("Provide a valid date", 400);
    await connectDB();
    return ok({ date, slots: await getSlotCapacities(date) });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const guard = await requireAdmin();
    if ("response" in guard) return guard.response;
    const body = slotCapacitySchema.parse(await readJson(request));
    await connectDB();
    return ok({ slot: await setSlotCapacity(body.date, body.time, body.capacity) });
  } catch (error) {
    return handleError(error);
  }
}
