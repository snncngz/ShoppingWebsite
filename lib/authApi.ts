import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";
import type { RegisterPendingDto, SafeUser } from "@/types/auth";

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

export function isUnverifiedEmailError(error: unknown): boolean {
  return error instanceof AuthApiError && error.message === "Email is not verified";
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof AuthApiError) {
    if (error.code === "CONFLICT") {
      if (error.message.toLowerCase().includes("last admin")) {
        return "Son yönetici hesabı silinemez.";
      }
      return "Bu e-posta ile kayıtlı bir hesap var.";
    }

    if (error.code === "UNAUTHORIZED") {
      return "E-posta veya şifre hatalı.";
    }

    if (error.code === "FORBIDDEN") {
      if (error.message === "Email is not verified") {
        return "E-posta adresiniz henüz doğrulanmadı. Gelen kutunuzdaki bağlantıya tıklayın.";
      }
      if (error.message.toLowerCase().includes("cross-origin")) {
        return "Güvenlik engeli: site adresi (API_BASE_URL) uyuşmuyor olabilir. Sayfayı yenileyip tekrar deneyin.";
      }
      return "Bu işlem için yetkiniz yok.";
    }

    if (error.code === "BAD_REQUEST") {
      if (error.message.toLowerCase().includes("real email")) {
        return "Geçici / sahte e-posta adresleriyle kayıt olunamaz.";
      }
      if (error.message.toLowerCase().includes("verification link")) {
        return "Doğrulama bağlantısı geçersiz veya süresi dolmuş. Yeni bir bağlantı isteyin.";
      }
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
}): Promise<RegisterPendingDto> {
  return authRequest<RegisterPendingDto>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function verifyEmailRequest(token: string): Promise<SafeUser> {
  return authRequest<SafeUser>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function resendVerificationRequest(email: string): Promise<{ ok: true }> {
  return authRequest<{ ok: true }>("/api/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function logoutRequest(): Promise<void> {
  await authRequest<{ ok: true }>("/api/auth/logout", {
    method: "POST",
  });
}

export async function deleteAccountRequest(password: string): Promise<void> {
  await authRequest<{ ok: true }>("/api/auth/me", {
    method: "DELETE",
    body: JSON.stringify({ password }),
  });
}
