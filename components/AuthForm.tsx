"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AuthFormProps = { mode: "login" | "register" };

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload =
      mode === "register"
        ? {
            name: String(form.get("name") ?? ""),
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
          }
        : {
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
          };

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        error?: string;
        user?: { role?: string };
      };
      if (!response.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      router.push(data.user?.role === "admin" ? "/admin" : "/menu");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isRegister = mode === "register";

  return (
    <main className="flex min-h-screen flex-col bg-[#faf7f2]">
      <div className="flex items-center gap-2 px-6 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#a3421f] text-sm font-bold text-white">
          S
        </span>
        <span className="text-sm font-semibold tracking-wide text-stone-700">
          Saffron &amp; Spice
        </span>
      </div>

      <div className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center">
        <div className="w-full max-w-sm">
          <h1 className="mb-2 text-center text-3xl font-semibold text-stone-900">
            {isRegister ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mb-6 text-center text-sm text-stone-500">
            {isRegister
              ? "Order online and reserve your table."
              : "Sign in to order, book and review."}
          </p>

          <form
            onSubmit={submit}
            className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
          >
            {isRegister && (
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-stone-700">
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  minLength={2}
                  autoComplete="name"
                  className="w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-[#a3421f] focus:ring-2 focus:ring-[#a3421f]/20"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-stone-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-[#a3421f] focus:ring-2 focus:ring-[#a3421f]/20"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-stone-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={isRegister ? 8 : 1}
                autoComplete={isRegister ? "new-password" : "current-password"}
                className="w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-[#a3421f] focus:ring-2 focus:ring-[#a3421f]/20"
              />
              {isRegister && (
                <p className="mt-1 text-xs text-stone-500">At least 8 characters</p>
              )}
            </div>

            {error && (
              <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#a3421f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7e3016] disabled:opacity-60"
            >
              {loading ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-stone-600">
            {isRegister ? "Already have an account? " : "New here? "}
            <Link
              href={isRegister ? "/login" : "/register"}
              className="font-semibold text-[#a3421f] hover:underline"
            >
              {isRegister ? "Sign in" : "Create an account"}
            </Link>
          </p>

          {!isRegister && (
            <div className="mt-6 space-y-1 rounded-lg border border-stone-200 bg-white/70 px-4 py-3 text-center text-xs text-stone-600">
              <p>Customer: <strong>alex@example.com</strong> / <strong>password123</strong></p>
              <p>Admin: <strong>admin@restaurant.test</strong> / <strong>password123</strong></p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
