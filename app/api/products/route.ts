import { getCurrentUser, requireAdmin } from "@/server/auth/authorization";
import { apiRoute } from "@/server/api/handler";
import { HttpStatus, jsonSuccess } from "@/server/api/http";
import {
  createProduct,
  listProducts,
  parseCreateProduct,
  readProductListQuery,
} from "@/server/services/products";
import { asJsonObject, readJsonBody } from "@/server/utils/json";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async (request) => {
  const query = readProductListQuery(request.nextUrl.searchParams);
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") {
    query.isActive = true;
  }
  return jsonSuccess(await listProducts(query));
});

export const POST = apiRoute(async (request) => {
  await requireAdmin();
  const body = asJsonObject(await readJsonBody(request));
  const product = await createProduct(parseCreateProduct(body));
  return jsonSuccess(product, HttpStatus.CREATED);
});
