import { getCurrentUser, requireAdmin } from "@/server/auth/authorization";
import { apiRoute } from "@/server/api/handler";
import { HttpStatus, jsonSuccess } from "@/server/api/http";
import {
  createCategory,
  listCategories,
  parseCreateCategory,
  readCategoryListQuery,
} from "@/server/services/categories";
import { asJsonObject, readJsonBody } from "@/server/utils/json";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async (request) => {
  const query = readCategoryListQuery(request.nextUrl.searchParams);
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") {
    query.isActive = true;
  }
  return jsonSuccess(await listCategories(query));
});

export const POST = apiRoute(async (request) => {
  await requireAdmin();
  const body = asJsonObject(await readJsonBody(request));
  const category = await createCategory(parseCreateCategory(body));
  return jsonSuccess(category, HttpStatus.CREATED);
});
