import { PrismaClient, UserRole } from "@prisma/client";

import { hashPassword } from "../server/auth/password";

export async function upsertAdminUser(
  prisma: PrismaClient,
  input: { email: string; password: string; name: string },
) {
  const email = input.email.trim().toLowerCase();
  const passwordHash = await hashPassword(input.password);

  return prisma.user.upsert({
    where: { email },
    update: {
      name: input.name,
      passwordHash,
      role: UserRole.ADMIN,
    },
    create: {
      name: input.name,
      email,
      passwordHash,
      role: UserRole.ADMIN,
    },
  });
}
