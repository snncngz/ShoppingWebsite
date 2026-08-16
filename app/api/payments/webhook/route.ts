import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import {
  handlePaymentWebhook,
  PAYMENT_SIGNATURE_HEADER,
} from "@/server/services/payment";

export const dynamic = "force-dynamic";

export const POST = apiRoute(async (request) => {
  const rawBody = await request.text();
  const signature = request.headers.get(PAYMENT_SIGNATURE_HEADER);
  return jsonSuccess(await handlePaymentWebhook(rawBody, signature));
});
