import type { NextRequest } from "next/server";

import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import { requireAuth } from "@/server/auth/authorization";
import {
  deleteCartItem,
  parseUpdateCartItem,
  updateCartItem,
} from "@/server/services/cart";
import { asJsonObject, readJsonBody } from "@/server/utils/json";

type IdContext = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export const PATCH = apiRoute(async (request: NextRequest, context: IdContext) => {
  const user = await requireAuth();
  const { id } = await context.params;
  const body = asJsonObject(await readJsonBody(request));
  return jsonSuccess(
    await updateCartItem(user.id, id, parseUpdateCartItem(body)),
  );
});

export const DELETE = apiRoute(async (_request: NextRequest, context: IdContext) => {
  const user = await requireAuth();
  const { id } = await context.params;
  return jsonSuccess(await deleteCartItem(user.id, id));
});
