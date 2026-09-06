import { createHash, randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { hashPassword } from "@/server/auth/password";
import { createSession } from "@/server/auth/session";
import { getServerEnv, isProduction } from "@/server/config/env";
import { getPrisma } from "@/server/db/prisma";
import { logger } from "@/server/logging/logger";
import { sendWelcomeEmail } from "@/server/services/settings";
import { assertRateLimit } from "@/server/security/http-guards";

const STATE_COOKIE = "lp_oauth_state";
const STATE_MAX_AGE = 10 * 60;

type GoogleProfile = {
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  given_name?: string;
  family_name?: string;
};

function siteOrigin(): string {
  return getServerEnv().apiBaseUrl.replace(/\/$/, "");
}

function googleRedirectUri(): string {
  return `${siteOrigin()}/api/auth/google/callback`;
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

function failRedirect(message: string): NextResponse {
  const target = new URL("/login", `${siteOrigin()}/`);
  target.searchParams.set("error", message);
  const response = NextResponse.redirect(target);
  response.cookies.set(STATE_COOKIE, "", cookieOptions(0));
  return response;
}

export function startGoogleAuth(): NextResponse {
  const env = getServerEnv();
  if (!env.googleClientId || !env.googleClientSecret) {
    return failRedirect("Google ile giriş henüz yapılandırılmadı.");
  }

  const state = randomBytes(24).toString("hex");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", env.googleClientId);
  url.searchParams.set("redirect_uri", googleRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(url);
  response.cookies.set(STATE_COOKIE, state, cookieOptions(STATE_MAX_AGE));
  return response;
}

function profileName(profile: GoogleProfile, email: string): string {
  const full = profile.name?.trim();
  if (full && full.length >= 2) {
    return full.slice(0, 80);
  }
  const parts = [profile.given_name, profile.family_name]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
  if (parts.join(" ").trim().length >= 2) {
    return parts.join(" ").slice(0, 80);
  }
  return email.split("@")[0]?.slice(0, 80) || "Lucien Perrin";
}

export async function completeGoogleAuth(input: {
  code: string | null;
  state: string | null;
  cookieState: string | undefined;
}): Promise<NextResponse> {
  assertRateLimit("google-oauth", 30, 15 * 60 * 1000);

  if (!input.code || !input.state || !input.cookieState) {
    return failRedirect("Google girişi iptal edildi.");
  }

  const expected = createHash("sha256").update(input.cookieState).digest("hex");
  const received = createHash("sha256").update(input.state).digest("hex");
  if (expected !== received) {
    return failRedirect("Google girişi doğrulanamadı.");
  }

  const env = getServerEnv();
  if (!env.googleClientId || !env.googleClientSecret) {
    return failRedirect("Google ile giriş henüz yapılandırılmadı.");
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    logger.error("google token exchange failed", { status: tokenResponse.status });
    return failRedirect("Google doğrulaması tamamlanamadı.");
  }

  const tokenPayload = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenPayload.access_token) {
    return failRedirect("Google doğrulaması tamamlanamadı.");
  }

  const profileResponse = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    { headers: { Authorization: `Bearer ${tokenPayload.access_token}` } },
  );
  if (!profileResponse.ok) {
    return failRedirect("Google profili okunamadı.");
  }

  const profile = (await profileResponse.json()) as GoogleProfile;
  const email = profile.email?.trim().toLowerCase();
  if (!email) {
    return failRedirect("Google hesabında e-posta yok.");
  }

  const verified =
    profile.email_verified === true || profile.email_verified === "true";
  if (!verified) {
    return failRedirect("Google e-postası doğrulanmamış.");
  }

  const prisma = getPrisma();
  const existing = await prisma.user.findUnique({ where: { email } });
  const name = profileName(profile, email);
  let created = false;

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: existing.name || name,
          emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
        },
      })
    : await (async () => {
        created = true;
        return prisma.user.create({
          data: {
            name,
            email,
            passwordHash: await hashPassword(randomBytes(32).toString("hex")),
            role: "USER",
            emailVerifiedAt: new Date(),
          },
        });
      })();

  if (created) {
    await sendWelcomeEmail(user);
  }

  const destination = user.role === "ADMIN" ? "/admin" : "/hesabim";
  const response = NextResponse.redirect(new URL(destination, `${siteOrigin()}/`));
  response.cookies.set(STATE_COOKIE, "", cookieOptions(0));

  try {
    await createSession(user.id, user.role, response);
  } catch (error: unknown) {
    logger.error("google session failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    return failRedirect("Oturum açılamadı.");
  }

  return response;
}
