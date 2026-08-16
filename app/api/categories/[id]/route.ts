import type { NextRequest } from "next/server";

import { apiRoute } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/http";
import {
  getCategoryById,
  hideCategory,
  parsePatchCategory,
  updateCategory,
} from "@/server/services/categories";
import { asJsonObject, readJsonBody } from "@/server/utils/json";

type IdContext = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export const GET = apiRoute(async (_request: NextRequest, context: IdContext) => {
  const { id } = await context.params;
  return jsonSuccess(await getCategoryById(id));
});

export const PATCH = apiRoute(async (request: NextRequest, context: IdContext) => {
  const { id } = await context.params;
  const body = asJsonObject(await readJsonBody(request));
  return jsonSuccess(await updateCategory(id, parsePatchCategory(body)));
});

export const DELETE = apiRoute(async (_request: NextRequest, context: IdContext) => {
  const { id } = await context.params;
  return jsonSuccess(await hideCategory(id));
});
