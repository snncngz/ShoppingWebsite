import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import {
  parseNewsletterSubscribe,
  subscribeNewsletter,
} from "@/server/services/newsletter";
import { asJsonObject, readJsonBody } from "@/server/utils/json";

export const dynamic = "force-dynamic";

export const POST = apiRoute(async (request) => {
  const body = asJsonObject(await readJsonBody(request));
  return jsonSuccess(
    await subscribeNewsletter(parseNewsletterSubscribe(body).email),
  );
});
