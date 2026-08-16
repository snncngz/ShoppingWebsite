import { checkDatabaseConnection } from "@/server/db/prisma";
import type { HealthData } from "@/types/api";

export async function getHealth(): Promise<HealthData> {
  try {
    await checkDatabaseConnection();
    return { status: "ok", database: "ok" };
  } catch (error) {
    console.error("[velora-db]", error);
    return { status: "ok", database: "unavailable" };
  }
}
