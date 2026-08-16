import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/server/api/http";

export function apiRoute<TContext = unknown>(
  handler: (
    request: NextRequest,
    context: TContext,
  ) => Response | Promise<Response>,
) {
  return async (request: NextRequest, context: TContext) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}
