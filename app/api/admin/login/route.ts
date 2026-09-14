import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  authConfigured,
  createSessionToken,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";
import { loginRateLimit, requestClientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!authConfigured()) {
    return NextResponse.json(
      { error: "Admin login is not configured. Set ADMIN_PASSWORD and SESSION_SECRET." },
      { status: 500 },
    );
  }

  const clientKey = requestClientKey(request);
  const limited = loginRateLimit.isBlocked(clientKey);
  if (limited.blocked) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Try again in a few minutes." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";
  if (!(await verifyPassword(password))) {
    loginRateLimit.recordFailure(clientKey);
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  loginRateLimit.reset(clientKey);
  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, token, sessionCookieOptions());
  return response;
}
