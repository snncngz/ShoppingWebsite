import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import { requireAdmin } from "@/server/auth/authorization";
import {
  listAdminInventory,
  readAdminInventoryListQuery,
} from "@/server/services/inventory";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async (request) => {
  await requireAdmin();
  return jsonSuccess(
    await listAdminInventory(
      readAdminInventoryListQuery(request.nextUrl.searchParams),
    ),
  );
});
