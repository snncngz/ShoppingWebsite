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
  const data = await listCategories(
    readCategoryListQuery(request.nextUrl.searchParams),
  );
  return jsonSuccess(data);
});

export const POST = apiRoute(async (request) => {
  const body = asJsonObject(await readJsonBody(request));
  const category = await createCategory(parseCreateCategory(body));
  return jsonSuccess(category, HttpStatus.CREATED);
});
