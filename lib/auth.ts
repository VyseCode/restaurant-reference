import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/models/User";

export const SESSION_COOKIE = "rs_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-only-secret-change-me-before-deploying",
);

export type Session = {
  userId: string;
  email: string;
  role: Role;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string;
};

export async function signSession(session: Session): Promise<string> {
  return new SignJWT({ email: session.email, role: session.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret);
}

export async function verifySession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub) return null;
    return {
      userId: payload.sub,
      email: typeof payload.email === "string" ? payload.email : "",
      role: payload.role === "admin" ? "admin" : "customer",
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export function toPublicUser(user: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
}): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl ?? "",
  };
}
