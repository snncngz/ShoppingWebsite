import { apiRoute } from "@/server/api/handler";
import { HttpStatus, jsonSuccess } from "@/server/api/http";
import { getHealth } from "@/server/services/health";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async () => {
  const data = await getHealth();
  const status =
    data.database === "ok" ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
  return jsonSuccess(data, status);
});
