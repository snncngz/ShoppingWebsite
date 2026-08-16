import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";

export class AdminApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "AdminApiError";
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

export async function adminRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const url =
    typeof window === "undefined" && path.startsWith("/")
      ? new URL(path, process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").toString()
      : path;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers,
      cache: "no-store",
      credentials: "include",
    });
  } catch {
    throw new AdminApiError(0, "INTERNAL_ERROR", "Sunucuya bağlanılamadı.");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new AdminApiError(
      response.status,
      "INTERNAL_ERROR",
      "Geçersiz API yanıtı.",
    );
  }

  if (isApiErrorResponse(payload)) {
    throw new AdminApiError(
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
    throw new AdminApiError(
      response.status,
      "INTERNAL_ERROR",
      "Geçersiz API yanıtı.",
    );
  }

  return (payload as ApiSuccessResponse<T>).data;
}

export function getAdminErrorMessage(error: unknown): string {
  if (error instanceof AdminApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "İşlem tamamlanamadı.";
}
