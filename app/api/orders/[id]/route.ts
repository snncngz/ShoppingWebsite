import type { NextRequest } from "next/server";

import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import { requireAuth } from "@/server/auth/authorization";
import { getOrder } from "@/server/services/orders";

type IdContext = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export const GET = apiRoute(async (_request: NextRequest, context: IdContext) => {
  const user = await requireAuth();
  const { id } = await context.params;
  return jsonSuccess(await getOrder(user.id, id));
});
