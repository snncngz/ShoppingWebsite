import type { NextRequest } from "next/server";

import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import { requireAdmin } from "@/server/auth/authorization";
import {
  getAdminInventory,
  parseAdminInventoryPatch,
  updateAdminInventory,
} from "@/server/services/inventory";
import { asJsonObject, readJsonBody } from "@/server/utils/json";

type ProductIdContext = {
  params: Promise<{ productId: string }>;
};

export const dynamic = "force-dynamic";

export const GET = apiRoute(async (
  _request: NextRequest,
  context: ProductIdContext,
) => {
  await requireAdmin();
  const { productId } = await context.params;
  return jsonSuccess(await getAdminInventory(productId));
});

export const PATCH = apiRoute(async (
  request: NextRequest,
  context: ProductIdContext,
) => {
  await requireAdmin();
  const { productId } = await context.params;
  const body = asJsonObject(await readJsonBody(request));
  return jsonSuccess(
    await updateAdminInventory(productId, parseAdminInventoryPatch(body)),
  );
});
