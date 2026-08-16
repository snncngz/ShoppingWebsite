import type { NextRequest } from "next/server";

import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import { requireAdmin } from "@/server/auth/authorization";
import {
  getAdminOrder,
  parseAdminOrderStatusPatch,
  updateAdminOrderStatus,
} from "@/server/services/admin-orders";
import { asJsonObject, readJsonBody } from "@/server/utils/json";

type IdContext = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export const GET = apiRoute(async (_request: NextRequest, context: IdContext) => {
  await requireAdmin();
  const { id } = await context.params;
  return jsonSuccess(await getAdminOrder(id));
});

export const PATCH = apiRoute(async (request: NextRequest, context: IdContext) => {
  await requireAdmin();
  const { id } = await context.params;
  const body = asJsonObject(await readJsonBody(request));
  return jsonSuccess(
    await updateAdminOrderStatus(id, parseAdminOrderStatusPatch(body)),
  );
});
