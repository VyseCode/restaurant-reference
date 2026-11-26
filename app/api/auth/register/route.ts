import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { fail, handleError, ok, readJson } from "@/lib/api";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
  toPublicUser,
} from "@/lib/auth";
import { registerSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body: z.infer<typeof registerSchema> = registerSchema.parse(
      await readJson(request),
    );
    await connectDB();

    if (await User.exists({ email: body.email })) {
      return fail("An account with that email already exists", 409);
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await User.create({
      name: body.name,
      email: body.email,
      password: passwordHash,
      role: "customer",
    });

    const token = await signSession({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions());

    return ok({ user: toPublicUser(user) }, 201);
  } catch (error) {
    return handleError(error);
  }
}
