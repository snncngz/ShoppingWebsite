import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";
import type { SafeUser } from "@/types/auth";

export class AuthApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
    this.code = code;
  }
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return Boolean(
    value &&
      typeof value === "object" &&
      "success" in value &&
      value.success === false &&
      "error" in value &&
      typeof value.error === "object" &&
      value.error !== null,
  );
}

async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers,
      cache: "no-store",
      credentials: "include",
    });
  } catch {
    throw new AuthApiError(0, "INTERNAL_ERROR", "Sunucuya bağlanılamadı.");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new AuthApiError(
      response.status,
      "INTERNAL_ERROR",
      "Geçersiz API yanıtı.",
    );
  }

  if (isApiErrorResponse(payload)) {
    throw new AuthApiError(
      response.status,
      payload.error.code,
      payload.error.message,
    );
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    !("success" in payload) ||
    payload.success !== true ||
    !("data" in payload)
  ) {
    throw new AuthApiError(
      response.status,
      "INTERNAL_ERROR",
      "Geçersiz API yanıtı.",
    );
  }

  return (payload as ApiSuccessResponse<T>).data;
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof AuthApiError) {
    if (error.code === "CONFLICT") {
      return "Bu e-posta ile kayıtlı bir hesap var.";
    }

    if (error.code === "UNAUTHORIZED") {
      return "E-posta veya şifre hatalı.";
    }

    if (error.code === "FORBIDDEN") {
      return "Bu işlem için yetkiniz yok.";
    }

    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "İşlem tamamlanamadı.";
}

export async function fetchCurrentUser(): Promise<SafeUser | null> {
  try {
    return await authRequest<SafeUser>("/api/auth/me");
  } catch (error) {
    if (error instanceof AuthApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<SafeUser> {
  return authRequest<SafeUser>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function registerRequest(input: {
  name: string;
  email: string;
  password: string;
}): Promise<SafeUser> {
  return authRequest<SafeUser>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function logoutRequest(): Promise<void> {
  await authRequest<{ ok: true }>("/api/auth/logout", {
    method: "POST",
  });
}
