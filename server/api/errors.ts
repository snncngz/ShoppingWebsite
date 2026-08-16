import type { ApiErrorCode } from "@/types/api";

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;

  constructor(status: number, code: ApiErrorCode, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function badRequest(message = "Invalid request"): never {
  throw new ApiError(400, "BAD_REQUEST", message);
}

export function unauthorized(message = "Authentication required"): never {
  throw new ApiError(401, "UNAUTHORIZED", message);
}

export function forbidden(message = "You do not have access to this resource"): never {
  throw new ApiError(403, "FORBIDDEN", message);
}

export function notFound(message = "Resource not found"): never {
  throw new ApiError(404, "NOT_FOUND", message);
}

export function conflict(message = "Resource conflict"): never {
  throw new ApiError(409, "CONFLICT", message);
}

export function methodNotAllowed(message = "Method not allowed"): never {
  throw new ApiError(405, "METHOD_NOT_ALLOWED", message);
}

export function internalError(message = "An unexpected error occurred"): never {
  throw new ApiError(500, "INTERNAL_ERROR", message);
}
