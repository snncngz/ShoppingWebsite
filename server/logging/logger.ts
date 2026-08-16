import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

export type LogLevel = "INFO" | "WARN" | "ERROR";

export type LogFields = Record<
  string,
  string | number | boolean | null | undefined
>;

type RequestStore = {
  requestId: string;
};

const requestStore = new AsyncLocalStorage<RequestStore>();

const SENSITIVE_KEY =
  /pass(word)?|secret|token|authorization|cookie|api[_-]?key|card|cvv|cvv2|pan|hash|session/i;

function sanitizeFields(fields?: LogFields): LogFields | undefined {
  if (!fields) {
    return undefined;
  }

  const out: LogFields = {};
  for (const [key, value] of Object.entries(fields)) {
    if (SENSITIVE_KEY.test(key)) {
      out[key] = "[redacted]";
      continue;
    }
    out[key] = value;
  }
  return out;
}

export function createRequestId(): string {
  return randomUUID();
}

export function getRequestId(): string | undefined {
  return requestStore.getStore()?.requestId;
}

export function runWithRequestId<T>(requestId: string, fn: () => T): T {
  return requestStore.run({ requestId }, fn);
}

export function log(
  level: LogLevel,
  message: string,
  fields?: LogFields,
): void {
  const payload = {
    level,
    message,
    requestId: getRequestId(),
    time: new Date().toISOString(),
    ...sanitizeFields(fields),
  };

  const line = JSON.stringify(payload);
  if (level === "ERROR") {
    console.error(line);
    return;
  }
  if (level === "WARN") {
    console.warn(line);
    return;
  }
  console.info(line);
}

export const logger = {
  info: (message: string, fields?: LogFields) => log("INFO", message, fields),
  warn: (message: string, fields?: LogFields) => log("WARN", message, fields),
  error: (message: string, fields?: LogFields) => log("ERROR", message, fields),
};
