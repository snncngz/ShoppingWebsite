/**
 * Server-only environment access. Do not import this module from
 * Client Components, `context/`, or other browser bundles.
 */

export type AppEnvironment = "development" | "production" | "test";

export type ServerEnv = {
  nodeEnv: AppEnvironment;
  apiBaseUrl: string;
  databaseUrl: string | undefined;
};

function readNodeEnv(): AppEnvironment {
  if (process.env.NODE_ENV === "production") {
    return "production";
  }

  if (process.env.NODE_ENV === "test") {
    return "test";
  }

  return "development";
}

function readOptional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function getServerEnv(): ServerEnv {
  return {
    nodeEnv: readNodeEnv(),
    apiBaseUrl: readOptional("API_BASE_URL") ?? "http://localhost:3000",
    databaseUrl: readOptional("DATABASE_URL"),
  };
}

export function requireDatabaseUrl(): string {
  const databaseUrl = getServerEnv().databaseUrl;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  return databaseUrl;
}

export function isProduction(): boolean {
  return getServerEnv().nodeEnv === "production";
}
