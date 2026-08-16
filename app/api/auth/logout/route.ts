import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import { logoutUser } from "@/server/services/auth";

export const dynamic = "force-dynamic";

export const POST = apiRoute(async () => {
  await logoutUser();
  return jsonSuccess({ ok: true });
});
