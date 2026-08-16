import { Prisma } from "@prisma/client";

import { badRequest, conflict, unauthorized } from "@/server/api/errors";
import { requireAuth, toSafeUser } from "@/server/auth/authorization";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { clearSession, createSession } from "@/server/auth/session";
import { getPrisma } from "@/server/db/prisma";
import { assertRateLimit } from "@/server/security/http-guards";
import { hasField } from "@/server/utils/validation";
import type { SafeUser } from "@/types/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_LETTER = /[A-Za-z]/;
const PASSWORD_NUMBER = /[0-9]/;
const DUMMY_PASSWORD_HASH = `scrypt:${"00".repeat(16)}:${"00".repeat(64)}`;
const CLIENT_OWNED_FIELDS = [
  "role",
  "userId",
  "id",
  "passwordHash",
  "createdAt",
  "updatedAt",
] as const;

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

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<SafeUser> {
  const passwordHash = await hashPassword(input.password);

  try {
    const user = await getPrisma().user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: "USER",
      },
    });
    await createSession(user.id, user.role);
    return toSafeUser(user);
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

  await createSession(user.id, user.role);
  return toSafeUser(user);
}

export async function logoutUser(): Promise<void> {
  await clearSession();
}

export async function getAuthenticatedUser(): Promise<SafeUser> {
  return requireAuth();
}
