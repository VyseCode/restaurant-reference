import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return fail(error.issues[0]?.message ?? "Invalid input", 400);
  }
  if (error instanceof SyntaxError) {
    return fail("Invalid JSON body", 400);
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  ) {
    return fail("That record already exists", 409);
  }
  console.error("[api] unexpected error:", error);
  return fail("Something went wrong. Please try again.", 500);
}

export async function readJson(request: Request): Promise<unknown> {
  return request.json();
}

export function paginationFrom(params: URLSearchParams, defaultLimit = 12) {
  const rawPage = Number(params.get("page") ?? 1);
  const rawLimit = Number(params.get("limit") ?? defaultLimit);
  const page = Number.isFinite(rawPage) ? Math.max(1, Math.floor(rawPage)) : 1;
  const limit = Number.isFinite(rawLimit)
    ? Math.min(48, Math.max(1, Math.floor(rawLimit)))
    : defaultLimit;
  return { page, limit };
}
