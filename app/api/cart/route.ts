import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import { requireAuth } from "@/server/auth/authorization";
import { clearCart, getCart } from "@/server/services/cart";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async () => {
  const user = await requireAuth();
  return jsonSuccess(await getCart(user.id));
});

export const DELETE = apiRoute(async () => {
  const user = await requireAuth();
  return jsonSuccess(await clearCart(user.id));
});
