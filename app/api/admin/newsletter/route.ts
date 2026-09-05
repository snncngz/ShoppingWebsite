import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import { requireAdmin } from "@/server/auth/authorization";
import { listNewsletterSubscribers } from "@/server/services/newsletter";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async () => {
  await requireAdmin();
  return jsonSuccess(await listNewsletterSubscribers());
});
