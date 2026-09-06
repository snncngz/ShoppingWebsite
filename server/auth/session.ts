import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/server/auth/constants";
import { signSessionToken, verifySessionToken } from "@/server/auth/token";
import { isProduction, requireAuthSecret } from "@/server/config/env";
import type { SessionUser, UserRole } from "@/types/auth";

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function createSession(
  userId: string,
  role: UserRole,
  response?: NextResponse,
): Promise<void> {
  const secret = requireAuthSecret();
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const token = await signSessionToken({ userId, role, exp }, secret);
  if (response) {
    response.cookies.set(SESSION_COOKIE, token, cookieOptions(SESSION_MAX_AGE_SECONDS));
    return;
  }
  const store = await cookies();
  store.set(SESSION_COOKIE, token, cookieOptions(SESSION_MAX_AGE_SECONDS));
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", cookieOptions(0));
}

export async function readSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  try {
    return await verifySessionToken(token, requireAuthSecret());
  } catch {
    return null;
  }
}
