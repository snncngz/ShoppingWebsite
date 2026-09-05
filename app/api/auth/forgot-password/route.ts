import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import {
  parseForgotPasswordInput,
  requestPasswordReset,
} from "@/server/services/auth";
import { asJsonObject, readJsonBody } from "@/server/utils/json";

export const dynamic = "force-dynamic";

export const POST = apiRoute(async (request) => {
  const body = asJsonObject(await readJsonBody(request));
  return jsonSuccess(
    await requestPasswordReset(parseForgotPasswordInput(body).email),
  );
});
