import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import { requireAdmin } from "@/server/auth/authorization";
import {
  parseAdminMailInput,
  sendAdminCampaignMail,
} from "@/server/services/admin-mail";
import { asJsonObject, readJsonBody } from "@/server/utils/json";

export const dynamic = "force-dynamic";

export const POST = apiRoute(async (request) => {
  await requireAdmin();
  const body = asJsonObject(await readJsonBody(request));
  return jsonSuccess(await sendAdminCampaignMail(parseAdminMailInput(body)));
});
