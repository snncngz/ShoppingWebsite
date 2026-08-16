import { adminRequest } from "@/lib/adminApi";
import { toStorefrontProduct } from "@/lib/mappers/product";
import type { Product } from "@/types";
import type { CategoryDto, PaginatedDto, ProductDto } from "@/types/api";

export const STOREFRONT_PAGE_SIZE = 20;
export const STOREFRONT_MAX_PAGE_SIZE = 100;

export type StorefrontSort = "price_asc" | "price_desc" | "newest" | "name_asc";

export type StorefrontProductQuery = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  slug?: string;
  sort?: StorefrontSort;
};

function buildProductQuery(input: StorefrontProductQuery): string {
  const params = new URLSearchParams();
  const limit = Math.min(input.limit ?? STOREFRONT_PAGE_SIZE, STOREFRONT_MAX_PAGE_SIZE);
  params.set("page", String(input.page ?? 1));
  params.set("limit", String(limit));
  params.set("isActive", "true");
  params.set("sort", input.sort ?? "newest");

  if (input.search) {
    params.set("search", input.search);
  }
  if (input.category) {
    params.set("category", input.category);
  }
  if (input.slug) {
    params.set("slug", input.slug);
  }

  return params.toString();
}

export async function fetchStorefrontProductPage(
  input: StorefrontProductQuery = {},
): Promise<PaginatedDto<Product>> {
  const data = await adminRequest<PaginatedDto<ProductDto>>(
    `/api/products?${buildProductQuery(input)}`,
  );

  return {
    items: data.items.map(toStorefrontProduct),
    pagination: data.pagination,
  };
}

export async function fetchStorefrontProductList(
  input: Omit<StorefrontProductQuery, "page" | "limit"> & { limit?: number },
): Promise<Product[]> {
  const items: Product[] = [];
  const limit = Math.min(input.limit ?? STOREFRONT_MAX_PAGE_SIZE, STOREFRONT_MAX_PAGE_SIZE);
  let page = 1;
  let totalPages = 0;

  do {
    const data = await fetchStorefrontProductPage({
      ...input,
      page,
      limit,
    });
    items.push(...data.items);
    totalPages = data.pagination.totalPages;
    page += 1;
  } while (totalPages > 0 && page <= totalPages);

  return items;
}

export async function fetchStorefrontProductBySlug(
  slug: string,
): Promise<{ product: Product; categorySlug: string } | null> {
  const data = await adminRequest<PaginatedDto<ProductDto>>(
    `/api/products?${buildProductQuery({ slug, limit: 1, sort: "newest" })}`,
  );
  const dto = data.items[0];
  if (!dto) {
    return null;
  }

  return {
    product: toStorefrontProduct(dto),
    categorySlug: dto.category.slug,
  };
}

async function fetchActiveProductPage(page: number): Promise<PaginatedDto<ProductDto>> {
  return adminRequest<PaginatedDto<ProductDto>>(
    `/api/products?${buildProductQuery({ page, limit: STOREFRONT_MAX_PAGE_SIZE, sort: "newest" })}`,
  );
}

export async function fetchStorefrontProducts(): Promise<Product[]> {
  const items: ProductDto[] = [];
  let page = 1;
  let totalPages = 0;

  do {
    const data = await fetchActiveProductPage(page);
    items.push(...data.items);
    totalPages = data.pagination.totalPages;
    page += 1;
  } while (totalPages > 0 && page <= totalPages);

  return items.map(toStorefrontProduct);
}

export async function fetchStorefrontCategories(): Promise<CategoryDto[]> {
  const [active, inactive] = await Promise.all([
    adminRequest<CategoryDto[]>("/api/categories?isActive=true"),
    adminRequest<CategoryDto[]>("/api/categories?isActive=false"),
  ]);

  return [...active, ...inactive];
}

export async function fetchStorefrontCatalog(): Promise<{
  products: Product[];
  categories: CategoryDto[];
}> {
  const [products, categories] = await Promise.all([
    fetchStorefrontProducts(),
    fetchStorefrontCategories(),
  ]);

  return { products, categories };
}
