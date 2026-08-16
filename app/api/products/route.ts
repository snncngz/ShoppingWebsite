import { requireAdmin } from "@/server/auth/authorization";
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
  const data = await listProducts(
    readProductListQuery(request.nextUrl.searchParams),
  );
  return jsonSuccess(data);
});

export const POST = apiRoute(async (request) => {
  await requireAdmin();
  const body = asJsonObject(await readJsonBody(request));
  const product = await createProduct(parseCreateProduct(body));
  return jsonSuccess(product, HttpStatus.CREATED);
});
