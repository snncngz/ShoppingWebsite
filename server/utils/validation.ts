import { badRequest } from "@/server/api/errors";

export function hasField(
  body: Record<string, unknown>,
  field: string,
): boolean {
  return Object.prototype.hasOwnProperty.call(body, field);
}

export function requireString(
  body: Record<string, unknown>,
  field: string,
  maxLength = 200,
): string {
  const value = body[field];

  if (typeof value !== "string" || value.trim().length === 0) {
    badRequest(`${field} is required`);
  }

  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    badRequest(`${field} is too long`);
  }

  return trimmed;
}

export function optionalString(
  body: Record<string, unknown>,
  field: string,
  maxLength = 2000,
): string | undefined {
  if (!hasField(body, field) || body[field] === undefined) {
    return undefined;
  }

  if (body[field] === null) {
    return "";
  }

  if (typeof body[field] !== "string") {
    badRequest(`${field} must be a string`);
  }

  const trimmed = body[field].trim();
  if (trimmed.length > maxLength) {
    badRequest(`${field} is too long`);
  }

  return trimmed;
}

export function optionalBoolean(
  body: Record<string, unknown>,
  field: string,
): boolean | undefined {
  if (!hasField(body, field) || body[field] === undefined) {
    return undefined;
  }

  if (typeof body[field] !== "boolean") {
    badRequest(`${field} must be a boolean`);
  }

  return body[field];
}

export function requireNumber(
  body: Record<string, unknown>,
  field: string,
): number {
  const value = body[field];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    badRequest(`${field} must be a valid number`);
  }

  return value;
}

export function optionalNumber(
  body: Record<string, unknown>,
  field: string,
): number | undefined {
  if (!hasField(body, field) || body[field] === undefined) {
    return undefined;
  }

  if (typeof body[field] !== "number" || !Number.isFinite(body[field])) {
    badRequest(`${field} must be a valid number`);
  }

  return body[field];
}

export function requireNonNegativeNumber(
  body: Record<string, unknown>,
  field: string,
): number {
  const value = requireNumber(body, field);
  if (value < 0) {
    badRequest(`${field} must not be negative`);
  }
  return value;
}

export function optionalNonNegativeNumber(
  body: Record<string, unknown>,
  field: string,
): number | undefined {
  const value = optionalNumber(body, field);
  if (value === undefined) {
    return undefined;
  }
  if (value < 0) {
    badRequest(`${field} must not be negative`);
  }
  return value;
}

export function requireInt(
  body: Record<string, unknown>,
  field: string,
): number {
  const value = requireNumber(body, field);
  if (!Number.isInteger(value)) {
    badRequest(`${field} must be an integer`);
  }
  return value;
}

export function optionalInt(
  body: Record<string, unknown>,
  field: string,
): number | undefined {
  const value = optionalNumber(body, field);
  if (value === undefined) {
    return undefined;
  }
  if (!Number.isInteger(value)) {
    badRequest(`${field} must be an integer`);
  }
  return value;
}

export function requireNonNegativeInt(
  body: Record<string, unknown>,
  field: string,
): number {
  const value = requireInt(body, field);
  if (value < 0) {
    badRequest(`${field} must not be negative`);
  }
  return value;
}

export function requirePositiveInt(
  body: Record<string, unknown>,
  field: string,
  max = 1_000_000,
): number {
  const value = requireInt(body, field);
  if (value < 1) {
    badRequest(`${field} must be >= 1`);
  }
  if (value > max) {
    badRequest(`${field} must be <= ${max}`);
  }
  return value;
}

export function optionalNonNegativeInt(
  body: Record<string, unknown>,
  field: string,
): number | undefined {
  const value = optionalInt(body, field);
  if (value === undefined) {
    return undefined;
  }
  if (value < 0) {
    badRequest(`${field} must not be negative`);
  }
  return value;
}

export function optionalStringArray(
  body: Record<string, unknown>,
  field: string,
  maxItems = 30,
  maxItemLength = 500,
): string[] | undefined {
  if (!hasField(body, field) || body[field] === undefined) {
    return undefined;
  }

  const value = body[field];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    badRequest(`${field} must be an array of strings`);
  }

  if (value.length > maxItems) {
    badRequest(`${field} must contain at most ${maxItems} items`);
  }

  return value.map((item, index) => {
    const trimmed = item.trim();
    if (trimmed.length > maxItemLength) {
      badRequest(`${field}[${index}] is too long`);
    }
    return trimmed;
  });
}

export function optionalJsonObject(
  body: Record<string, unknown>,
  field: string,
): Record<string, unknown> | undefined {
  if (!hasField(body, field) || body[field] === undefined) {
    return undefined;
  }

  const value = body[field];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    badRequest(`${field} must be an object`);
  }

  if (JSON.stringify(value).length > 20_000) {
    badRequest(`${field} is too large`);
  }

  return value as Record<string, unknown>;
}

export function requireId(id: string): string {
  const value = id.trim();
  if (!value) {
    badRequest("id is required");
  }
  if (value.length > 64) {
    badRequest("id is invalid");
  }
  return value;
}

export function parseQueryPositiveInt(
  raw: string | null,
  field: string,
  fallback: number,
  max = 10_000,
): number {
  if (raw === null || raw === "") {
    return fallback;
  }

  if (!/^\d+$/.test(raw)) {
    badRequest(`${field} must be a positive integer`);
  }

  const value = Number(raw);
  if (value < 1) {
    badRequest(`${field} must be >= 1`);
  }
  if (value > max) {
    badRequest(`${field} must be <= ${max}`);
  }

  return value;
}

export function parseQueryBoolean(
  raw: string | null,
  field: string,
  fallback: boolean,
): boolean {
  if (raw === null || raw === "") {
    return fallback;
  }

  if (raw === "true") {
    return true;
  }

  if (raw === "false") {
    return false;
  }

  badRequest(`${field} must be true or false`);
}

export function parseQueryString(
  raw: string | null,
  maxLength = 100,
): string | undefined {
  if (raw === null) {
    return undefined;
  }

  const value = raw.trim();
  if (value.length === 0) {
    return undefined;
  }
  if (value.length > maxLength) {
    badRequest("query parameter is too long");
  }
  return value;
}
