import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import {
  deleteOwnAccount,
  getAuthenticatedUser,
  parseDeleteOwnAccountInput,
  parseUpdateProfileInput,
  updateProfile,
} from "@/server/services/auth";
import { asJsonObject, readJsonBody } from "@/server/utils/json";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async () => {
  const user = await getAuthenticatedUser();
  return jsonSuccess(user);
});

export const PATCH = apiRoute(async (request) => {
  const body = asJsonObject(await readJsonBody(request));
  return jsonSuccess(await updateProfile(parseUpdateProfileInput(body)));
});

export const DELETE = apiRoute(async (request) => {
  const body = asJsonObject(await readJsonBody(request));
  const { password } = parseDeleteOwnAccountInput(body);
  return jsonSuccess(await deleteOwnAccount(password));
});
