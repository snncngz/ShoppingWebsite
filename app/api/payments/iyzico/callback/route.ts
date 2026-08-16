import { NextResponse } from "next/server";

import { badRequest } from "@/server/api/errors";
import { apiRoute } from "@/server/api/handler";
import { getServerEnv } from "@/server/config/env";
import { handleIyzicoCallback } from "@/server/services/payment";

export const dynamic = "force-dynamic";

async function readToken(request: Request): Promise<string> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { token?: unknown };
    return typeof body.token === "string" ? body.token.trim() : "";
  }

  const form = await request.formData();
  const token = form.get("token");
  return typeof token === "string" ? token.trim() : "";
}

export const POST = apiRoute(async (request) => {
  const token = await readToken(request);
  if (!token) {
    badRequest("token is required");
  }
  const result = await handleIyzicoCallback(token);
  const url = new URL("/checkout/sonuc", getServerEnv().apiBaseUrl);
  url.searchParams.set("orderId", result.orderId);
  url.searchParams.set(
    "payment",
    result.status === "SUCCEEDED" ? "ok" : "fail",
  );
  return NextResponse.redirect(url, 303);
});
