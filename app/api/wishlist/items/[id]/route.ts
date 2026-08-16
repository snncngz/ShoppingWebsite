import type { NextRequest } from "next/server";

import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import { requireAuth } from "@/server/auth/authorization";
import { deleteWishlistItem } from "@/server/services/wishlist";

type IdContext = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export const DELETE = apiRoute(async (_request: NextRequest, context: IdContext) => {
  const user = await requireAuth();
  const { id } = await context.params;
  return jsonSuccess(await deleteWishlistItem(user.id, id));
});
