import { Types } from "mongoose";
import { getSession, toPublicUser } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export async function GET() {
  const session = await getSession();
  if (!session || !Types.ObjectId.isValid(session.userId)) {
    return fail("You must be signed in", 401);
  }

  try {
    await connectDB();
    const user = await User.findById(session.userId).select(
      "name email role avatarUrl",
    );
    if (!user) return fail("You must be signed in", 401);
    return ok({ user: toPublicUser(user) });
  } catch (error) {
    return handleError(error);
  }
}
