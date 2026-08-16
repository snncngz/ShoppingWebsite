import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/server/api/http";
import { enforceApiGuards } from "@/server/security/http-guards";

export function apiRoute<TContext = unknown>(
  handler: (
    request: NextRequest,
    context: TContext,
  ) => Response | Promise<Response>,
) {
  return async (request: NextRequest, context: TContext) => {
    try {
      enforceApiGuards(request);
      return await handler(request, context);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}
