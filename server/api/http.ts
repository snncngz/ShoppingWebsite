import { NextResponse } from "next/server";

import { isProduction } from "@/server/config/env";
import { ApiError } from "@/server/api/errors";
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
  INTERNAL_ERROR: 500,
} as const;

export function jsonSuccess<T>(
  data: T,
  status: number = HttpStatus.OK,
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
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
    { status: error.status },
  );
}

export function toErrorResponse(error: unknown): NextResponse<ApiErrorResponse> {
  if (error instanceof ApiError) {
    return jsonError(error);
  }

  console.error("[velora-api]", error);

  const message = isProduction()
    ? "An unexpected error occurred"
    : error instanceof Error
      ? error.message
      : "An unexpected error occurred";

  return jsonError(new ApiError(HttpStatus.INTERNAL_ERROR, "INTERNAL_ERROR", message));
}
