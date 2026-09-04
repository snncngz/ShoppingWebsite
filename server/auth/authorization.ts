import type { User } from "@prisma/client";

import { forbidden, unauthorized } from "@/server/api/errors";
import { readSession } from "@/server/auth/session";
import { getPrisma } from "@/server/db/prisma";
import type { SafeUser } from "@/types/auth";

export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: Boolean(user.emailVerifiedAt),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const session = await readSession();
  if (!session) {
    return null;
  }

  const user = await getPrisma().user.findUnique({
    where: { id: session.userId },
  });

  if (!user || !user.emailVerifiedAt) {
    return null;
  }

  return toSafeUser(user);
}

export async function requireAuth(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    unauthorized();
  }

  return user;
}

export async function requireRole(role: SafeUser["role"]): Promise<SafeUser> {
  const user = await requireAuth();
  if (user.role !== role) {
    forbidden();
  }

  return user;
}

export async function requireAdmin(): Promise<SafeUser> {
  return requireRole("ADMIN");
}
