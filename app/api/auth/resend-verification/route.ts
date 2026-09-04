import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import {
  parseResendVerificationInput,
  resendVerification,
} from "@/server/services/auth";
import { asJsonObject, readJsonBody } from "@/server/utils/json";

export const dynamic = "force-dynamic";

export const POST = apiRoute(async (request) => {
  const body = asJsonObject(await readJsonBody(request));
  const result = await resendVerification(parseResendVerificationInput(body).email);
  return jsonSuccess(result);
});
