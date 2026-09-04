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
  mailFrom: string | undefined;
  smtpHost: string | undefined;
  smtpPort: number;
  smtpUser: string | undefined;
  smtpPassword: string | undefined;
  resendApiKey: string | undefined;
};

export class EnvValidationError extends Error {
  readonly missing: string[];

  constructor(message: string, missing: string[] = []) {
    super(message);
    this.name = "EnvValidationError";
    this.missing = missing;
  }
}

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
    mailFrom: readOptional("MAIL_FROM"),
    smtpHost: readOptional("SMTP_HOST"),
    smtpPort: Number(readOptional("SMTP_PORT") ?? "587") || 587,
    smtpUser: readOptional("SMTP_USER"),
    smtpPassword: readOptional("SMTP_PASS"),
    resendApiKey: readOptional("RESEND_API_KEY"),
  };
}

export function requireDatabaseUrl(): string {
  const databaseUrl = getServerEnv().databaseUrl;

  if (!databaseUrl) {
    throw new EnvValidationError("DATABASE_URL is not set", ["DATABASE_URL"]);
  }

  return databaseUrl;
}

export function isProduction(): boolean {
  return getServerEnv().nodeEnv === "production";
}

export function requireAuthSecret(): string {
  const authSecret = getServerEnv().authSecret;

  if (!authSecret) {
    throw new EnvValidationError("AUTH_SECRET is not set", ["AUTH_SECRET"]);
  }

  if (isProduction() && authSecret.length < 32) {
    throw new EnvValidationError(
      "AUTH_SECRET must be at least 32 characters in production",
      ["AUTH_SECRET"],
    );
  }

  return authSecret;
}

export function requirePaymentWebhookSecret(): string {
  const env = getServerEnv();
  if (env.paymentWebhookSecret) {
    return env.paymentWebhookSecret;
  }

  const localHost =
    env.apiBaseUrl.includes("localhost") ||
    env.apiBaseUrl.includes("127.0.0.1");

  // Development or local production smoke may reuse AUTH_SECRET.
  // Hosted production must set PAYMENT_WEBHOOK_SECRET explicitly.
  if ((!isProduction() || localHost) && env.authSecret) {
    return env.authSecret;
  }

  throw new EnvValidationError("PAYMENT_WEBHOOK_SECRET is not set", [
    "PAYMENT_WEBHOOK_SECRET",
  ]);
}

export function paymentCurrency(): string {
  const currency = getServerEnv().paymentCurrency.toUpperCase();
  if (currency !== "TRY") {
    throw new EnvValidationError("PAYMENT_CURRENCY must be TRY", [
      "PAYMENT_CURRENCY",
    ]);
  }
  return currency;
}

/**
 * Fail closed in production runtime. Never logs secret values.
 * Skipped during `next build` (NEXT_PHASE=phase-production-build).
 * Local `next start` with localhost API_BASE_URL is allowed for smoke tests.
 */
export function assertProductionEnv(): void {
  if (!isProduction()) {
    return;
  }

  const env = getServerEnv();
  const missing: string[] = [];
  const localHost =
    env.apiBaseUrl.includes("localhost") ||
    env.apiBaseUrl.includes("127.0.0.1");

  if (!env.databaseUrl) {
    missing.push("DATABASE_URL");
  }
  if (!env.authSecret) {
    missing.push("AUTH_SECRET");
  } else if (env.authSecret.length < 32) {
    throw new EnvValidationError(
      "AUTH_SECRET must be at least 32 characters in production",
      ["AUTH_SECRET"],
    );
  }

  if (!env.paymentWebhookSecret && !localHost) {
    missing.push("PAYMENT_WEBHOOK_SECRET");
  }

  if (!env.apiBaseUrl) {
    missing.push("API_BASE_URL");
  } else if (!localHost) {
    try {
      const url = new URL(env.apiBaseUrl);
      if (url.protocol !== "https:") {
        throw new EnvValidationError(
          "API_BASE_URL must use https in production",
          ["API_BASE_URL"],
        );
      }
    } catch (error) {
      if (error instanceof EnvValidationError) {
        throw error;
      }
      throw new EnvValidationError("API_BASE_URL is invalid", ["API_BASE_URL"]);
    }
  }

  const provider = (env.paymentProvider ?? "test").toLowerCase();
  if (provider === "iyzico") {
    if (!env.iyzicoApiKey) {
      missing.push("IYZICO_API_KEY");
    }
    if (!env.iyzicoSecretKey) {
      missing.push("IYZICO_SECRET_KEY");
    }
    if (!localHost && env.iyzicoBaseUrl.includes("sandbox")) {
      throw new EnvValidationError(
        "IYZICO_BASE_URL must not point at sandbox in production when PAYMENT_PROVIDER=iyzico",
        ["IYZICO_BASE_URL"],
      );
    }
  }

  if (!localHost) {
    if (!env.mailFrom) {
      missing.push("MAIL_FROM");
    }
    const hasResend = Boolean(env.resendApiKey);
    const hasSmtp = Boolean(env.smtpHost && env.smtpUser && env.smtpPassword);
    if (!hasResend && !hasSmtp) {
      missing.push("RESEND_API_KEY or SMTP_HOST/SMTP_USER/SMTP_PASS");
    }
  }

  if (missing.length > 0) {
    throw new EnvValidationError(
      `Missing required production environment variables: ${missing.join(", ")}`,
      missing,
    );
  }
}
