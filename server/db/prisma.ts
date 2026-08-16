import { PrismaClient } from "@prisma/client";

import { getServerEnv, requireDatabaseUrl } from "@/server/config/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasourceUrl: requireDatabaseUrl(),
    log: getServerEnv().nodeEnv === "development" ? ["error", "warn"] : ["error"],
  });
}

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

export async function checkDatabaseConnection(): Promise<void> {
  await getPrisma().$queryRaw`SELECT 1`;
}

export async function disconnectPrisma(): Promise<void> {
  if (!globalForPrisma.prisma) {
    return;
  }

  await globalForPrisma.prisma.$disconnect();
  globalForPrisma.prisma = undefined;
}
