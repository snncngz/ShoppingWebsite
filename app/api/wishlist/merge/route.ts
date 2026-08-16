import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import { requireAuth } from "@/server/auth/authorization";
import {
  mergeWishlistItems,
  parseMergeWishlistItems,
} from "@/server/services/wishlist";
import { asJsonObject, readJsonBody } from "@/server/utils/json";

export const dynamic = "force-dynamic";

export const POST = apiRoute(async (request) => {
  const user = await requireAuth();
  const body = asJsonObject(await readJsonBody(request));
  return jsonSuccess(
    await mergeWishlistItems(user.id, parseMergeWishlistItems(body)),
  );
});
