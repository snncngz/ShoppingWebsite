import type { SessionUser, UserRole } from "@/types/auth";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type SessionTokenPayload = {
  userId: string;
  role: UserRole;
  exp: number;
};

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function hmacSha256(secret: string, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return new Uint8Array(signature);
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return diff === 0;
}

function isUserRole(value: unknown): value is UserRole {
  return value === "USER" || value === "ADMIN";
}

export async function signSessionToken(
  payload: SessionTokenPayload,
  secret: string,
): Promise<string> {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = toBase64Url(await hmacSha256(secret, body));
  return `${body}.${signature}`;
}

export async function verifySessionToken(
  token: string,
  secret: string,
): Promise<SessionUser | null> {
  const [body, signature] = token.split(".");
  if (!body || !signature) {
    return null;
  }

  const expected = toBase64Url(await hmacSha256(secret, body));
  if (!timingSafeEqual(expected, signature)) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(decoder.decode(fromBase64Url(body)));
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const record = parsed as {
      userId?: unknown;
      role?: unknown;
      exp?: unknown;
    };

    if (
      typeof record.userId !== "string" ||
      !isUserRole(record.role) ||
      typeof record.exp !== "number"
    ) {
      return null;
    }

    if (record.exp * 1000 <= Date.now()) {
      return null;
    }

    return { userId: record.userId, role: record.role };
  } catch {
    return null;
  }
}
