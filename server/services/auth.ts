import { Prisma } from "@prisma/client";

import { badRequest, conflict, forbidden, internalError, unauthorized } from "@/server/api/errors";
import { getCurrentUser, requireAuth, toSafeUser } from "@/server/auth/authorization";
import { createEmailToken, hashEmailToken } from "@/server/auth/email-token";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { clearSession, createSession } from "@/server/auth/session";
import { getPublicOrigin } from "@/server/config/env";
import { getPrisma } from "@/server/db/prisma";
import { logger } from "@/server/logging/logger";
import { isDisposableEmail } from "@/server/mail/disposable-domains";
import { isMailConfigured, sendMail } from "@/server/mail/mailer";
import { verificationEmailContent, passwordResetEmailContent } from "@/server/mail/templates";
import { assertRateLimit } from "@/server/security/http-guards";
import { sendWelcomeEmail } from "@/server/services/settings";
import { assertNotLastAdmin, purgeUserById } from "@/server/services/users";
import { hasField } from "@/server/utils/validation";
import type { RegisterPendingDto, SafeUser } from "@/types/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_LETTER = /[A-Za-z]/;
const PASSWORD_NUMBER = /[0-9]/;
const DUMMY_PASSWORD_HASH = `scrypt:${"00".repeat(16)}:${"00".repeat(64)}`;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const CLIENT_OWNED_FIELDS = [
  "role",
  "userId",
  "id",
  "passwordHash",
  "createdAt",
  "updatedAt",
  "emailVerifiedAt",
] as const;

export const EMAIL_NOT_VERIFIED_MESSAGE = "Email is not verified";

function isUniqueEmailError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function parseEmail(value: unknown, field = "email"): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    badRequest(`${field} is required`);
  }

  const email = value.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    badRequest("Enter a valid email address");
  }

  return email;
}

function parsePassword(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    badRequest("password is required");
  }

  if (value.length < 8) {
    badRequest("Password must be at least 8 characters");
  }

  if (value.length > 128) {
    badRequest("Password is too long");
  }

  if (!PASSWORD_LETTER.test(value) || !PASSWORD_NUMBER.test(value)) {
    badRequest("Password must include a letter and a number");
  }

  return value;
}

function parseName(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    badRequest("name is required");
  }

  const name = value.trim();
  if (name.length < 2) {
    badRequest("name is too short");
  }

  if (name.length > 80) {
    badRequest("name is too long");
  }

  return name;
}

function parseToken(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    badRequest("token is required");
  }
  const token = value.trim();
  if (token.length < 32 || token.length > 128) {
    badRequest("token is invalid");
  }
  return token;
}

export function parseRegisterInput(body: Record<string, unknown>): {
  name: string;
  email: string;
  password: string;
} {
  for (const field of CLIENT_OWNED_FIELDS) {
    if (hasField(body, field)) {
      badRequest(`${field} cannot be set by the client`);
    }
  }

  return {
    name: parseName(body.name),
    email: parseEmail(body.email),
    password: parsePassword(body.password),
  };
}

export function parseLoginInput(body: Record<string, unknown>): {
  email: string;
  password: string;
} {
  return {
    email: parseEmail(body.email),
    password:
      typeof body.password === "string" && body.password.length > 0
        ? body.password
        : badRequest("password is required"),
  };
}

export function parseVerifyEmailInput(body: Record<string, unknown>): { token: string } {
  return { token: parseToken(body.token) };
}

export function parseResendVerificationInput(body: Record<string, unknown>): {
  email: string;
} {
  return { email: parseEmail(body.email) };
}

export function parseDeleteOwnAccountInput(body: Record<string, unknown>): {
  password: string;
} {
  if (typeof body.password !== "string" || body.password.length === 0) {
    badRequest("password is required");
  }
  return { password: body.password };
}

function verifyUrl(token: string): string {
  return `${getPublicOrigin()}/dogrula?token=${encodeURIComponent(token)}`;
}

async function issueVerification(user: {
  id: string;
  name: string;
  email: string;
}): Promise<string> {
  const prisma = getPrisma();
  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });

  const token = createEmailToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashEmailToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const content = verificationEmailContent({
    name: user.name,
    verifyUrl: verifyUrl(token),
  });
  await sendMail({
    to: user.email,
    subject: content.subject,
    text: content.text,
    html: content.html,
  }).catch((error: unknown) => {
    logger.error("verification email failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    internalError("Could not send verification email");
  });

  return token;
}

function pendingPayload(email: string, token: string): RegisterPendingDto {
  const pending: RegisterPendingDto = {
    pendingVerification: true,
    email,
  };
  if (!isMailConfigured()) {
    pending.verificationToken = token;
  }
  return pending;
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<RegisterPendingDto> {
  if (isDisposableEmail(input.email)) {
    badRequest("Use a real email address");
  }

  const prisma = getPrisma();
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing?.emailVerifiedAt) {
    conflict("An account with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);

  try {
    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: input.name,
            passwordHash,
            role: "USER",
          },
        })
      : await prisma.user.create({
          data: {
            name: input.name,
            email: input.email,
            passwordHash,
            role: "USER",
          },
        });

    const token = await issueVerification(user);
    if (!existing) {
      await sendWelcomeEmail(user);
    }
    return pendingPayload(user.email, token);
  } catch (error) {
    if (isUniqueEmailError(error)) {
      conflict("An account with this email already exists");
    }
    throw error;
  }
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<SafeUser> {
  const user = await getPrisma().user.findUnique({
    where: { email: input.email },
  });

  const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
  const matches = await verifyPassword(input.password, passwordHash);

  if (!user || !matches) {
    assertRateLimit(`login-fail:${input.email}`, 10, 15 * 60 * 1000);
    unauthorized("Invalid email or password");
  }

  if (!user.emailVerifiedAt) {
    forbidden(EMAIL_NOT_VERIFIED_MESSAGE);
  }

  await createSession(user.id, user.role);
  return toSafeUser(user);
}

export async function verifyEmail(token: string): Promise<SafeUser> {
  const tokenHash = hashEmailToken(token);
  const row = await getPrisma().emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!row || row.expiresAt.getTime() < Date.now()) {
    const current = await getCurrentUser();
    if (current?.emailVerified) {
      return current;
    }
    badRequest("Verification link is invalid or expired");
  }

  const user = await getPrisma().$transaction(async (tx) => {
    await tx.emailVerificationToken.deleteMany({ where: { userId: row.userId } });
    return tx.user.update({
      where: { id: row.userId },
      data: { emailVerifiedAt: row.user.emailVerifiedAt ?? new Date() },
    });
  });

  await createSession(user.id, user.role);
  return toSafeUser(user);
}

export async function resendVerification(email: string): Promise<{ ok: true }> {
  assertRateLimit(`verify-resend:${email}`, 5, 15 * 60 * 1000);

  const user = await getPrisma().user.findUnique({
    where: { email },
  });

  if (user && !user.emailVerifiedAt) {
    await issueVerification(user);
  }

  return { ok: true };
}

export async function logoutUser(): Promise<void> {
  await clearSession();
}

export async function deleteOwnAccount(password: string): Promise<{ ok: true }> {
  const current = await requireAuth();
  const row = await getPrisma().user.findUnique({
    where: { id: current.id },
  });
  const passwordHash = row?.passwordHash ?? DUMMY_PASSWORD_HASH;
  const matches = await verifyPassword(password, passwordHash);

  if (!row || !matches) {
    unauthorized("Invalid email or password");
  }

  await assertNotLastAdmin(row.role);
  await getPrisma().$transaction((tx) => purgeUserById(tx, row.id));
  await clearSession();
  return { ok: true };
}

export function parseForgotPasswordInput(body: Record<string, unknown>): {
  email: string;
} {
  return { email: parseEmail(body.email) };
}

export function parseResetPasswordInput(body: Record<string, unknown>): {
  token: string;
  password: string;
} {
  return {
    token: parseToken(body.token),
    password: parsePassword(body.password),
  };
}

export function parseUpdateProfileInput(body: Record<string, unknown>): {
  name?: string;
  phone: string;
  addressTitle: string;
  addressLine: string;
  addressCity: string;
} {
  const phone =
    typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : "";
  const addressTitle =
    typeof body.addressTitle === "string"
      ? body.addressTitle.trim().slice(0, 40) || "Ev"
      : "Ev";
  const addressLine =
    typeof body.addressLine === "string"
      ? body.addressLine.trim().slice(0, 200)
      : "";
  const addressCity =
    typeof body.addressCity === "string"
      ? body.addressCity.trim().slice(0, 80)
      : "";

  return {
    name: hasField(body, "name") ? parseName(body.name) : undefined,
    phone,
    addressTitle,
    addressLine,
    addressCity,
  };
}

function resetUrl(token: string): string {
  return `${getPublicOrigin()}/sifre-yenile?token=${encodeURIComponent(token)}`;
}

export async function requestPasswordReset(email: string): Promise<{ ok: true }> {
  assertRateLimit(`password-reset:${email}`, 5, 15 * 60 * 1000);

  const user = await getPrisma().user.findUnique({ where: { email } });
  if (!user || !user.emailVerifiedAt) {
    return { ok: true };
  }

  await getPrisma().passwordResetToken.deleteMany({ where: { userId: user.id } });
  const token = createEmailToken();
  await getPrisma().passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashEmailToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const content = passwordResetEmailContent({
    name: user.name,
    resetUrl: resetUrl(token),
  });
  await sendMail({
    to: user.email,
    subject: content.subject,
    text: content.text,
    html: content.html,
  }).catch((error: unknown) => {
    logger.error("password reset email failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    internalError("Could not send password reset email");
  });

  return { ok: true };
}

export async function resetPassword(input: {
  token: string;
  password: string;
}): Promise<{ ok: true }> {
  const tokenHash = hashEmailToken(input.token);
  const row = await getPrisma().passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!row || row.expiresAt.getTime() < Date.now()) {
    badRequest("Reset link is invalid or expired");
  }

  const passwordHash = await hashPassword(input.password);
  await getPrisma().$transaction(async (tx) => {
    await tx.passwordResetToken.deleteMany({ where: { userId: row.userId } });
    await tx.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    });
  });

  return { ok: true };
}

export async function updateProfile(
  input: ReturnType<typeof parseUpdateProfileInput>,
): Promise<SafeUser> {
  const current = await requireAuth();
  const user = await getPrisma().user.update({
    where: { id: current.id },
    data: {
      ...(input.name ? { name: input.name } : {}),
      phone: input.phone,
      addressTitle: input.addressTitle,
      addressLine: input.addressLine,
      addressCity: input.addressCity,
    },
  });
  return toSafeUser(user);
}

export async function getAuthenticatedUser(): Promise<SafeUser> {
  return requireAuth();
}
