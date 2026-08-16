import { checkDatabaseConnection } from "@/server/db/prisma";
import { getServerEnv } from "@/server/config/env";
import { logger } from "@/server/logging/logger";
import type { HealthData } from "@/types/api";

export async function getHealth(): Promise<HealthData> {
  const environment = getServerEnv().nodeEnv;

  try {
    await checkDatabaseConnection();
    return {
      status: "ok",
      database: "ok",
      environment,
    };
  } catch (error) {
    logger.error("Health check database unavailable", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return {
      status: "degraded",
      database: "unavailable",
      environment,
    };
  }
}
