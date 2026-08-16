import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import { requireAdmin } from "@/server/auth/authorization";
import {
  listAdminOrders,
  readAdminOrderListQuery,
} from "@/server/services/admin-orders";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async (request) => {
  await requireAdmin();
  return jsonSuccess(
    await listAdminOrders(readAdminOrderListQuery(request.nextUrl.searchParams)),
  );
});
