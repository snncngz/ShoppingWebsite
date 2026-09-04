import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import { requireAdmin } from "@/server/auth/authorization";
import {
  listAdminUsers,
  readAdminUserListQuery,
} from "@/server/services/users";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async (request) => {
  const admin = await requireAdmin();
  return jsonSuccess(
    await listAdminUsers(
      readAdminUserListQuery(request.nextUrl.searchParams),
      admin.id,
    ),
  );
});
