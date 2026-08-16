import { apiRoute } from "@/server/api/handler";
import { HttpStatus, jsonSuccess } from "@/server/api/http";
import { requireAuth } from "@/server/auth/authorization";
import {
  clientIp,
  createPayment,
  listPaymentsForOrder,
  parseCreatePayment,
} from "@/server/services/payment";
import { asJsonObject, readJsonBody } from "@/server/utils/json";
import { parseQueryString } from "@/server/utils/validation";
import { badRequest } from "@/server/api/errors";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async (request) => {
  const user = await requireAuth();
  const orderId = parseQueryString(request.nextUrl.searchParams.get("orderId"));
  if (!orderId) {
    badRequest("orderId is required");
  }
  return jsonSuccess(await listPaymentsForOrder(user.id, orderId));
});

export const POST = apiRoute(async (request) => {
  const user = await requireAuth();
  const body = asJsonObject(await readJsonBody(request));
  return jsonSuccess(
    await createPayment(user.id, parseCreatePayment(body).orderId, {
      ip: clientIp(request),
    }),
    HttpStatus.CREATED,
  );
});
