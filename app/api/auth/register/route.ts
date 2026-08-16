import { apiRoute } from "@/server/api/handler";
import { HttpStatus, jsonSuccess } from "@/server/api/http";
import { parseRegisterInput, registerUser } from "@/server/services/auth";
import { asJsonObject, readJsonBody } from "@/server/utils/json";

export const dynamic = "force-dynamic";

export const POST = apiRoute(async (request) => {
  const body = asJsonObject(await readJsonBody(request));
  const user = await registerUser(parseRegisterInput(body));
  return jsonSuccess(user, HttpStatus.CREATED);
});
