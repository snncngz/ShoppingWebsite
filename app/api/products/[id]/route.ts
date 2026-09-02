import type { NextRequest } from "next/server";

import { getCurrentUser, requireAdmin } from "@/server/auth/authorization";
import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import {
  deleteProduct,
  getProductById,
  parsePatchProduct,
  updateProduct,
} from "@/server/services/products";
import { asJsonObject, readJsonBody } from "@/server/utils/json";

type IdContext = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export const GET = apiRoute(async (_request: NextRequest, context: IdContext) => {
  const { id } = await context.params;
  const user = await getCurrentUser();
  return jsonSuccess(
    await getProductById(id, { includeInactive: user?.role === "ADMIN" }),
  );
});

export const PATCH = apiRoute(async (request: NextRequest, context: IdContext) => {
  await requireAdmin();
  const { id } = await context.params;
  const body = asJsonObject(await readJsonBody(request));
  return jsonSuccess(await updateProduct(id, parsePatchProduct(body)));
});

export const DELETE = apiRoute(async (_request: NextRequest, context: IdContext) => {
  await requireAdmin();
  const { id } = await context.params;
  return jsonSuccess(await deleteProduct(id));
});
