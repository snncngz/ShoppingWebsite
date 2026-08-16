import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import { getHealth } from "@/server/services/health";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async () => jsonSuccess(await getHealth()));
