import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { fail, handleError, ok, readJson } from "@/lib/api";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
  toPublicUser,
} from "@/lib/auth";
import { loginSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await readJson(request));
    await connectDB();

    const user = await User.findOne({ email: body.email }).select("+password");
    if (!user || !(await bcrypt.compare(body.password, user.password))) {
      return fail("Invalid email or password", 401);
    }

    const token = await signSession({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions());

    return ok({ user: toPublicUser(user) });
  } catch (error) {
    return handleError(error);
  }
}
