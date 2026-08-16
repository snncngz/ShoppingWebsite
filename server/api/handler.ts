import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/server/api/http";
import {
  createRequestId,
  runWithRequestId,
} from "@/server/logging/logger";
import { enforceApiGuards } from "@/server/security/http-guards";

export function apiRoute<TContext = unknown>(
  handler: (
    request: NextRequest,
    context: TContext,
  ) => Response | Promise<Response>,
) {
  return async (request: NextRequest, context: TContext) => {
    const incoming = request.headers.get("x-request-id")?.trim();
    const requestId =
      incoming && incoming.length > 0 && incoming.length <= 64
        ? incoming
        : createRequestId();

    return runWithRequestId(requestId, async () => {
      try {
        enforceApiGuards(request);
        return await handler(request, context);
      } catch (error) {
        return toErrorResponse(error);
      }
    });
  };
}
