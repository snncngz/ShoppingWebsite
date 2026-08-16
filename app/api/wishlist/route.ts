import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import { requireAuth } from "@/server/auth/authorization";
import { getWishlist } from "@/server/services/wishlist";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async () => {
  const user = await requireAuth();
  return jsonSuccess(await getWishlist(user.id));
});
