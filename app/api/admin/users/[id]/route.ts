import type { NextRequest } from "next/server";

import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import { requireAdmin } from "@/server/auth/authorization";
import { adminDeleteUser } from "@/server/services/users";

type IdContext = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export const DELETE = apiRoute(async (_request: NextRequest, context: IdContext) => {
  const admin = await requireAdmin();
  const { id } = await context.params;
  return jsonSuccess(await adminDeleteUser(id, admin.id));
});
