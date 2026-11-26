import { Types } from "mongoose";
import { requireAdmin, requireUser } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Reservation } from "@/models/Reservation";
import { User } from "@/models/User";
import { reservationUpdateSchema } from "@/lib/schemas";
import { claimSlot, releaseSlot } from "@/lib/slot-capacity";

type Ctx = RouteContext<"/api/reservations/[id]">;

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const guard = await requireUser();
    if ("response" in guard) return guard.response;
    const { id } = await ctx.params;
    if (!Types.ObjectId.isValid(id)) return fail("Invalid reservation", 400);
    await connectDB();

    const reservation = await Reservation.findById(id);
    if (!reservation) return fail("Reservation not found", 404);
    if (
      guard.session.role !== "admin" &&
      reservation.user.toString() !== guard.session.userId
    ) {
      return fail("Not allowed", 403);
    }
    const user = await User.findById(reservation.user).select("name").lean();
    return ok({
      reservation: {
        ...reservation.toObject(),
        id: reservation._id.toString(),
        userName: user?.name,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const guard = await requireUser();
    if ("response" in guard) return guard.response;
    const { id } = await ctx.params;
    if (!Types.ObjectId.isValid(id)) return fail("Invalid reservation", 400);
    const body = reservationUpdateSchema.parse(await readJson(request));
    await connectDB();

    const reservation = await Reservation.findById(id);
    if (!reservation) return fail("Reservation not found", 404);
    const isAdmin = guard.session.role === "admin";
    const isOwner = reservation.user.toString() === guard.session.userId;
    if (!isAdmin && !isOwner) return fail("Not allowed", 403);
    if (!isAdmin && body.status !== "cancelled") {
      return fail("Only staff can change a booking status", 403);
    }

    const previous = reservation.status;
    const next = body.status;
    let claimed = false;
    let released = false;
    if (next !== previous) {
      if (next === "confirmed") {
        if (!(await claimSlot(reservation.date, reservation.time))) {
          return fail("This time slot is fully booked", 409);
        }
        claimed = true;
      } else if (previous === "confirmed") {
        await releaseSlot(reservation.date, reservation.time);
        released = true;
      }
    }

    reservation.status = next;
    if (body.notes !== undefined) reservation.notes = body.notes;
    try {
      await reservation.save();
    } catch (error) {
      if (claimed) await releaseSlot(reservation.date, reservation.time);
      if (released) await claimSlot(reservation.date, reservation.time);
      throw error;
    }
    return ok({ reservation: { ...reservation.toObject(), id: reservation._id.toString() } });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const guard = await requireAdmin();
    if ("response" in guard) return guard.response;
    const { id } = await ctx.params;
    if (!Types.ObjectId.isValid(id)) return fail("Invalid reservation", 400);
    await connectDB();
    const reservation = await Reservation.findByIdAndDelete(id);
    if (!reservation) return fail("Reservation not found", 404);
    if (reservation.status === "confirmed") {
      await releaseSlot(reservation.date, reservation.time);
    }
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
