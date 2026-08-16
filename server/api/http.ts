import { NextResponse } from "next/server";

import { isProduction } from "@/server/config/env";
import { ApiError } from "@/server/api/errors";
import { getRequestId, logger } from "@/server/logging/logger";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";

export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

function apiHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("Cache-Control", "private, no-store");
  const requestId = getRequestId();
  if (requestId) {
    headers.set("X-Request-Id", requestId);
  }
  return headers;
}

export function jsonSuccess<T>(
  data: T,
  status: number = HttpStatus.OK,
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data }, { status, headers: apiHeaders() });
}

export function jsonError(
  error: ApiError,
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    },
    { status: error.status, headers: apiHeaders() },
  );
}

export function toErrorResponse(error: unknown): NextResponse<ApiErrorResponse> {
  if (error instanceof ApiError) {
    if (error.status >= 500) {
      logger.error("API error", {
        code: error.code,
        status: error.status,
        message: error.message,
      });
    } else if (error.status === 401 || error.status === 403) {
      logger.warn("API authz failure", {
        code: error.code,
        status: error.status,
      });
    }
    return jsonError(error);
  }

  logger.error("Unhandled API exception", {
    errorName: error instanceof Error ? error.name : "unknown",
    errorMessage:
      error instanceof Error ? error.message.slice(0, 300) : "unknown",
  });

  const message = isProduction()
    ? "An unexpected error occurred"
    : error instanceof Error
      ? error.message
      : "An unexpected error occurred";

  return jsonError(new ApiError(HttpStatus.INTERNAL_ERROR, "INTERNAL_ERROR", message));
}
