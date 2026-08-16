import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/server/api/http";

type RouteHandler = (request: NextRequest) => Response | Promise<Response>;

export function apiRoute(handler: RouteHandler): RouteHandler {
  return async (request) => {
    try {
      return await handler(request);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}
