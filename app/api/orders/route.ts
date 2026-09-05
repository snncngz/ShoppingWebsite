import { apiRoute } from "@/server/api/handler";
import { HttpStatus, jsonSuccess } from "@/server/api/http";
import { requireAuth } from "@/server/auth/authorization";
import { createOrder, listOrders, parseCreateOrder } from "@/server/services/orders";
import { asJsonObject } from "@/server/utils/json";
import { badRequest } from "@/server/api/errors";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async () => {
  const user = await requireAuth();
  return jsonSuccess(await listOrders(user.id));
});

export const POST = apiRoute(async (request) => {
  const user = await requireAuth();
  const raw = await request.text();
  let input = { giftWrap: false };
  if (raw.trim()) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      badRequest("Request body must be valid JSON");
    }
    input = parseCreateOrder(asJsonObject(parsed));
  }
  return jsonSuccess(await createOrder(user.id, input), HttpStatus.CREATED);
});
