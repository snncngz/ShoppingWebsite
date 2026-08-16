import type { NextRequest } from "next/server";

import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import { requireAdmin } from "@/server/auth/authorization";
import {
  listAdminInventoryMovements,
  readMovementListQuery,
} from "@/server/services/inventory";

type ProductIdContext = {
  params: Promise<{ productId: string }>;
};

export const dynamic = "force-dynamic";

export const GET = apiRoute(async (
  request: NextRequest,
  context: ProductIdContext,
) => {
  await requireAdmin();
  const { productId } = await context.params;
  const query = readMovementListQuery(request.nextUrl.searchParams);
  return jsonSuccess(
    await listAdminInventoryMovements(productId, query.page, query.limit),
  );
});
