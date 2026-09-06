import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import { requireAdmin } from "@/server/auth/authorization";
import {
  getWelcomeSettings,
  parseWelcomeSettingsInput,
  updateWelcomeSettings,
} from "@/server/services/settings";
import { asJsonObject, readJsonBody } from "@/server/utils/json";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async () => {
  await requireAdmin();
  return jsonSuccess(await getWelcomeSettings());
});

export const PUT = apiRoute(async (request) => {
  await requireAdmin();
  const body = asJsonObject(await readJsonBody(request));
  return jsonSuccess(
    await updateWelcomeSettings(parseWelcomeSettingsInput(body)),
  );
});
