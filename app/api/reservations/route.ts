import { requireUser } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Reservation } from "@/models/Reservation";
import { getReservations } from "@/lib/queries";
import { paginationFrom } from "@/lib/api";
import { SLOT_CAPACITY, isBookableSlot } from "@/lib/constants";
import { reservationCreateSchema } from "@/lib/schemas";

export async function GET(request: Request) {
  try {
    const guard = await requireUser();
    if ("response" in guard) return guard.response;
    const { searchParams } = new URL(request.url);
    const { page, limit } = paginationFrom(searchParams);
    const all = guard.session.role === "admin" && searchParams.get("all") === "true";
    await connectDB();

    return ok(
      await getReservations({
        userId: all ? undefined : guard.session.userId,
        date: searchParams.get("date") ?? undefined,
        status: searchParams.get("status") ?? undefined,
        page,
        limit,
      }),
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const guard = await requireUser();
    if ("response" in guard) return guard.response;
    const body = reservationCreateSchema.parse(await readJson(request));
    await connectDB();

    if (!isBookableSlot(body.date, body.time)) {
      return fail("That date or time has already passed", 400);
    }
    if (
      await Reservation.exists({
        user: guard.session.userId,
        date: body.date,
        time: body.time,
        status: "confirmed",
      })
    ) {
      return fail("You already have a booking for that date and time", 409);
    }
    const booked = await Reservation.countDocuments({
      date: body.date,
      time: body.time,
      status: "confirmed",
    });
    if (booked >= SLOT_CAPACITY) {
      return fail("This time slot is fully booked", 409);
    }

    const reservation = await Reservation.create({
      ...body,
      user: guard.session.userId,
      status: "confirmed",
    });
    return ok(
      {
        reservation: {
          ...reservation.toObject(),
          id: reservation._id.toString(),
        },
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
