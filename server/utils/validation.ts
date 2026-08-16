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
): string {
  const value = body[field];

  if (typeof value !== "string" || value.trim().length === 0) {
    badRequest(`${field} is required`);
  }

  return value.trim();
}

export function optionalString(
  body: Record<string, unknown>,
  field: string,
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

  return body[field].trim();
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
): string[] | undefined {
  if (!hasField(body, field) || body[field] === undefined) {
    return undefined;
  }

  const value = body[field];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    badRequest(`${field} must be an array of strings`);
  }

  return value;
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

  return value as Record<string, unknown>;
}

export function requireId(id: string): string {
  const value = id.trim();
  if (!value) {
    badRequest("id is required");
  }
  return value;
}

export function parseQueryPositiveInt(
  raw: string | null,
  field: string,
  fallback: number,
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
): string | undefined {
  if (raw === null) {
    return undefined;
  }

  const value = raw.trim();
  return value.length > 0 ? value : undefined;
}
