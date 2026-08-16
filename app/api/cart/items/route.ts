import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import { requireAuth } from "@/server/auth/authorization";
import { addCartItem, parseAddCartItem } from "@/server/services/cart";
import { asJsonObject, readJsonBody } from "@/server/utils/json";

export const dynamic = "force-dynamic";

export const POST = apiRoute(async (request) => {
  const user = await requireAuth();
  const body = asJsonObject(await readJsonBody(request));
  return jsonSuccess(await addCartItem(user.id, parseAddCartItem(body)));
});
