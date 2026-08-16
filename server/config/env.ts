/**
 * Server-only environment access. Do not import this module from
 * Client Components, `context/`, or other browser bundles.
 */

export type AppEnvironment = "development" | "production" | "test";

export type ServerEnv = {
  nodeEnv: AppEnvironment;
  apiBaseUrl: string;
  databaseUrl: string | undefined;
  authSecret: string | undefined;
  adminEmail: string | undefined;
  adminPassword: string | undefined;
  adminName: string | undefined;
  paymentProvider: string | undefined;
  paymentCurrency: string;
  paymentWebhookSecret: string | undefined;
  iyzicoApiKey: string | undefined;
  iyzicoSecretKey: string | undefined;
  iyzicoBaseUrl: string;
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
    authSecret: readOptional("AUTH_SECRET"),
    adminEmail: readOptional("ADMIN_EMAIL"),
    adminPassword: readOptional("ADMIN_PASSWORD"),
    adminName: readOptional("ADMIN_NAME"),
    paymentProvider: readOptional("PAYMENT_PROVIDER"),
    paymentCurrency: readOptional("PAYMENT_CURRENCY") ?? "TRY",
    paymentWebhookSecret: readOptional("PAYMENT_WEBHOOK_SECRET"),
    iyzicoApiKey: readOptional("IYZICO_API_KEY"),
    iyzicoSecretKey: readOptional("IYZICO_SECRET_KEY"),
    iyzicoBaseUrl:
      readOptional("IYZICO_BASE_URL") ?? "https://sandbox-api.iyzipay.com",
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

export function requireAuthSecret(): string {
  const authSecret = getServerEnv().authSecret;

  if (!authSecret) {
    throw new Error("AUTH_SECRET is not set");
  }

  if (isProduction() && authSecret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters in production");
  }

  return authSecret;
}

export function requirePaymentWebhookSecret(): string {
  const env = getServerEnv();
  if (env.paymentWebhookSecret) {
    return env.paymentWebhookSecret;
  }
  if (env.authSecret) {
    return env.authSecret;
  }
  throw new Error("PAYMENT_WEBHOOK_SECRET is not set");
}

export function paymentCurrency(): string {
  const currency = getServerEnv().paymentCurrency.toUpperCase();
  if (currency !== "TRY") {
    throw new Error("PAYMENT_CURRENCY must be TRY");
  }
  return currency;
}
