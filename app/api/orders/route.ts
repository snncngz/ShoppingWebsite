import { apiRoute } from "@/server/api/handler";
import { HttpStatus, jsonSuccess } from "@/server/api/http";
import { requireAuth } from "@/server/auth/authorization";
import { createOrder, listOrders } from "@/server/services/orders";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async () => {
  const user = await requireAuth();
  return jsonSuccess(await listOrders(user.id));
});

export const POST = apiRoute(async () => {
  const user = await requireAuth();
  return jsonSuccess(await createOrder(user.id), HttpStatus.CREATED);
});
