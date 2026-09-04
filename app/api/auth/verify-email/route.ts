import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import { parseVerifyEmailInput, verifyEmail } from "@/server/services/auth";
import { asJsonObject, readJsonBody } from "@/server/utils/json";

export const dynamic = "force-dynamic";

export const POST = apiRoute(async (request) => {
  const body = asJsonObject(await readJsonBody(request));
  const user = await verifyEmail(parseVerifyEmailInput(body).token);
  return jsonSuccess(user);
});
