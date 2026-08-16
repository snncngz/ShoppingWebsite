import type { Instrumentation } from "next";

import {
  EnvValidationError,
  assertProductionEnv,
  isProduction,
} from "@/server/config/env";
import { disconnectPrisma } from "@/server/db/prisma";
import { logger } from "@/server/logging/logger";

let shutdownRegistered = false;

function registerGracefulShutdown(): void {
  if (shutdownRegistered) {
    return;
  }
  shutdownRegistered = true;

  const shutdown = async (signal: string) => {
    logger.info("Graceful shutdown started", { signal });
    try {
      await disconnectPrisma();
      logger.info("Database connections closed", { signal });
    } catch (error) {
      logger.error("Database disconnect failed during shutdown", {
        signal,
        errorName: error instanceof Error ? error.name : "unknown",
      });
    }
  };

  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });
}

export async function registerNode(): Promise<void> {
  // `next build` also loads instrumentation — do not fail the build on missing runtime secrets.
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }

  try {
    assertProductionEnv();
    if (isProduction()) {
      logger.info("Production environment validated");
    }
  } catch (error) {
    const message =
      error instanceof EnvValidationError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Environment validation failed";
    logger.error("Environment validation failed", {
      errorName: error instanceof Error ? error.name : "unknown",
      detail: message,
    });
    throw error;
  }

  registerGracefulShutdown();
}

export async function reportRequestError(
  err: unknown,
  request: Parameters<Instrumentation.onRequestError>[1],
  context: Parameters<Instrumentation.onRequestError>[2],
): Promise<void> {
  const message = err instanceof Error ? err.message : "unknown error";
  const digest =
    typeof err === "object" && err !== null && "digest" in err
      ? String((err as { digest?: unknown }).digest)
      : undefined;

  logger.error("Unhandled request error", {
    path: request.path,
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
    digest,
    errorName: err instanceof Error ? err.name : "unknown",
    errorMessage: message.slice(0, 300),
  });
}
