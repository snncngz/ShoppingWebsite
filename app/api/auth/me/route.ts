import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import { getAuthenticatedUser } from "@/server/services/auth";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async () => {
  const user = await getAuthenticatedUser();
  return jsonSuccess(user);
});
