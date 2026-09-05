import { Prisma } from "@prisma/client";

import { badRequest, conflict, notFound } from "@/server/api/errors";
import { getPrisma } from "@/server/db/prisma";
import { getCategorySubtreeIdsBySlug } from "@/server/services/categories";
import { toDecimal, toProductDto, productCategoryInclude } from "@/server/dto/catalog";
import {
  applyAbsoluteStock,
  recordInitialStock,
} from "@/server/services/inventory";
import {
  hasField,
  optionalBoolean,
  optionalJsonObject,
  optionalNonNegativeInt,
  optionalNonNegativeNumber,
  optionalString,
  optionalStringArray,
  parseQueryBoolean,
  parseQueryPositiveInt,
  parseQueryString,
  requireId,
  requireNonNegativeInt,
  requireNonNegativeNumber,
  requireString,
} from "@/server/utils/validation";
import type { PaginatedDto, ProductDto } from "@/types/api";

const PRODUCT_INCLUDE = productCategoryInclude;

const PRODUCT_SORTS = ["price_asc", "price_desc", "newest", "name_asc"] as const;
type ProductSort = (typeof PRODUCT_SORTS)[number];

export type ProductListInput = {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  slug?: string;
  isActive: boolean;
  sort: ProductSort;
};

type ProductWriteInput = {
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  oldPrice?: number | null;
  discount?: number | null;
  stock?: number;
  subcategory?: string;
  images?: string[];
  colors?: string[];
  sizes?: string[];
  rating?: number;
  reviewCount?: number;
  isPopular?: boolean;
  isNew?: boolean;
  isActive?: boolean;
  badge?: string | null;
  campaignPercent?: number | null;
  perfumeDetails?: Record<string, unknown>;
  categoryId?: string;
};

function isProductSort(value: string): value is ProductSort {
  return (PRODUCT_SORTS as readonly string[]).includes(value);
}

function sortToOrderBy(
  sort: ProductSort,
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ price: "asc" }, { id: "asc" }];
    case "price_desc":
      return [{ price: "desc" }, { id: "asc" }];
    case "name_asc":
      return [{ name: "asc" }, { id: "asc" }];
    default:
      return [{ createdAt: "desc" }, { id: "asc" }];
  }
}

function optionalCampaignPercent(
  body: Record<string, unknown>,
): number | null | undefined {
  if (!hasField(body, "campaignPercent")) {
    return undefined;
  }
  if (body.campaignPercent === null || body.campaignPercent === "") {
    return null;
  }
  const value = optionalNonNegativeInt(body, "campaignPercent");
  if (value === undefined || value === 0) {
    return null;
  }
  if (value > 90) {
    badRequest("campaignPercent must be <= 90");
  }
  return value;
}

function isUniqueSlugError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function requireCategory(categoryId: string) {
  const category = await getPrisma().category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    notFound("Category not found");
  }

  return category;
}

async function requireProduct(id: string) {
  const product = await getPrisma().product.findUnique({
    where: { id },
    include: PRODUCT_INCLUDE,
  });

  if (!product) {
    notFound("Product not found");
  }

  return product;
}

export function readProductListQuery(
  params: URLSearchParams,
): ProductListInput {
  const page = parseQueryPositiveInt(params.get("page"), "page", 1);
  const limit = parseQueryPositiveInt(params.get("limit"), "limit", 20);
  if (limit > 100) {
    badRequest("limit must be <= 100");
  }

  const sortRaw = parseQueryString(params.get("sort"));
  let sort: ProductSort = "newest";
  if (sortRaw) {
    if (!isProductSort(sortRaw)) {
      badRequest("sort is invalid");
    }
    sort = sortRaw;
  }

  return {
    page,
    limit,
    search: parseQueryString(params.get("search")),
    category: parseQueryString(params.get("category")),
    slug: parseQueryString(params.get("slug")),
    isActive: parseQueryBoolean(params.get("isActive"), "isActive", true),
    sort,
  };
}

export function parseCreateProduct(body: Record<string, unknown>) {
  return {
    name: requireString(body, "name"),
    slug: requireString(body, "slug"),
    description: optionalString(body, "description", 8000) ?? "",
    price: requireNonNegativeNumber(body, "price"),
    oldPrice: optionalNonNegativeNumber(body, "oldPrice"),
    discount: optionalNonNegativeInt(body, "discount"),
    stock: requireNonNegativeInt(body, "stock"),
    subcategory: optionalString(body, "subcategory") ?? "",
    images: optionalStringArray(body, "images") ?? [],
    colors: optionalStringArray(body, "colors") ?? [],
    sizes: optionalStringArray(body, "sizes") ?? [],
    rating: optionalNonNegativeNumber(body, "rating") ?? 0,
    reviewCount: optionalNonNegativeInt(body, "reviewCount") ?? 0,
    isPopular: optionalBoolean(body, "isPopular") ?? false,
    isNew: optionalBoolean(body, "isNew") ?? false,
    isActive: optionalBoolean(body, "isActive") ?? true,
    badge: optionalString(body, "badge") || null,
    campaignPercent: optionalCampaignPercent(body) ?? null,
    perfumeDetails: optionalJsonObject(body, "perfumeDetails"),
    categoryId: requireString(body, "categoryId"),
  };
}

export function parsePatchProduct(body: Record<string, unknown>): ProductWriteInput {
  const patch: ProductWriteInput = {
    description: optionalString(body, "description", 8000),
    price: optionalNonNegativeNumber(body, "price"),
    stock: optionalNonNegativeInt(body, "stock"),
    subcategory: optionalString(body, "subcategory"),
    images: optionalStringArray(body, "images"),
    colors: optionalStringArray(body, "colors"),
    sizes: optionalStringArray(body, "sizes"),
    rating: optionalNonNegativeNumber(body, "rating"),
    reviewCount: optionalNonNegativeInt(body, "reviewCount"),
    isPopular: optionalBoolean(body, "isPopular"),
    isNew: optionalBoolean(body, "isNew"),
    isActive: optionalBoolean(body, "isActive"),
    perfumeDetails: optionalJsonObject(body, "perfumeDetails"),
  };

  if (hasField(body, "name")) {
    patch.name = requireString(body, "name");
  }
  if (hasField(body, "slug")) {
    patch.slug = requireString(body, "slug");
  }
  if (hasField(body, "categoryId")) {
    patch.categoryId = requireString(body, "categoryId");
  }

  if (hasField(body, "oldPrice")) {
    patch.oldPrice =
      body.oldPrice === null ? null : optionalNonNegativeNumber(body, "oldPrice");
  }

  if (hasField(body, "discount")) {
    patch.discount =
      body.discount === null ? null : optionalNonNegativeInt(body, "discount");
  }

  if (hasField(body, "campaignPercent")) {
    patch.campaignPercent = optionalCampaignPercent(body) ?? null;
  }

  if (hasField(body, "badge")) {
    const badge = optionalString(body, "badge");
    patch.badge = badge ? badge : null;
  }

  if (Object.values(patch).every((value) => value === undefined)) {
    badRequest("No fields to update");
  }

  return patch;
}

export async function listProducts(
  input: ProductListInput,
): Promise<PaginatedDto<ProductDto>> {
  const where: Prisma.ProductWhereInput = {
    isActive: input.isActive,
  };

  if (input.category) {
    const ids = await getCategorySubtreeIdsBySlug(input.category);
    where.categoryId = { in: ids ?? [] };
  }

  if (input.slug) {
    where.slug = input.slug;
  }

  if (input.search) {
    where.OR = [
      { name: { contains: input.search, mode: "insensitive" } },
      { description: { contains: input.search, mode: "insensitive" } },
    ];
  }

  const prisma = getPrisma();
  const total = await prisma.product.count({ where });
  const items = await prisma.product.findMany({
    where,
    include: PRODUCT_INCLUDE,
    orderBy: sortToOrderBy(input.sort),
    skip: (input.page - 1) * input.limit,
    take: input.limit,
  });

  return {
    items: items.map(toProductDto),
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / input.limit),
    },
  };
}

export async function getProductById(
  id: string,
  options?: { includeInactive?: boolean },
): Promise<ProductDto> {
  const product = await requireProduct(requireId(id));
  if (!product.isActive && !options?.includeInactive) {
    notFound("Product not found");
  }
  return toProductDto(product);
}

export async function createProduct(
  input: ReturnType<typeof parseCreateProduct>,
): Promise<ProductDto> {
  await requireCategory(input.categoryId);

  try {
    return await getPrisma().$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          price: toDecimal(input.price),
          oldPrice:
            input.oldPrice === undefined ? undefined : input.oldPrice === null
              ? null
              : toDecimal(input.oldPrice),
          discount: input.discount ?? null,
          stock: input.stock,
          subcategory: input.subcategory,
          images: input.images,
          colors: input.colors,
          sizes: input.sizes,
          rating: toDecimal(input.rating),
          reviewCount: input.reviewCount,
          isPopular: input.isPopular,
          isNew: input.isNew,
          isActive: input.isActive,
          badge: input.badge,
          campaignPercent: input.campaignPercent ?? null,
          perfumeDetails: (input.perfumeDetails ??
            Prisma.JsonNull) as Prisma.InputJsonValue,
          categoryId: input.categoryId,
        },
        include: PRODUCT_INCLUDE,
      });

      await recordInitialStock(tx, product.id, input.stock);
      return toProductDto(product);
    });
  } catch (error) {
    if (isUniqueSlugError(error)) {
      conflict("Product slug already exists");
    }
    throw error;
  }
}

export async function updateProduct(
  id: string,
  input: ProductWriteInput,
): Promise<ProductDto> {
  await requireProduct(requireId(id));

  if (input.categoryId) {
    await requireCategory(input.categoryId);
  }

  const data: Prisma.ProductUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.description !== undefined) data.description = input.description;
  if (input.price !== undefined) data.price = toDecimal(input.price);
  if (input.oldPrice !== undefined) {
    data.oldPrice = input.oldPrice === null ? null : toDecimal(input.oldPrice);
  }
  if (input.discount !== undefined) data.discount = input.discount;
  if (input.subcategory !== undefined) data.subcategory = input.subcategory;
  if (input.images !== undefined) data.images = input.images;
  if (input.colors !== undefined) data.colors = input.colors;
  if (input.sizes !== undefined) data.sizes = input.sizes;
  if (input.rating !== undefined) data.rating = toDecimal(input.rating);
  if (input.reviewCount !== undefined) data.reviewCount = input.reviewCount;
  if (input.isPopular !== undefined) data.isPopular = input.isPopular;
  if (input.isNew !== undefined) data.isNew = input.isNew;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.badge !== undefined) data.badge = input.badge;
  if (input.campaignPercent !== undefined) data.campaignPercent = input.campaignPercent;
  if (input.perfumeDetails !== undefined) {
    data.perfumeDetails = input.perfumeDetails as Prisma.InputJsonValue;
  }
  if (input.categoryId !== undefined) {
    data.category = { connect: { id: input.categoryId } };
  }

  try {
    return await getPrisma().$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.product.update({
          where: { id },
          data,
        });
      }

      if (input.stock !== undefined) {
        await applyAbsoluteStock(tx, id, input.stock, "product_update");
      }

      const product = await tx.product.findUniqueOrThrow({
        where: { id },
        include: PRODUCT_INCLUDE,
      });
      return toProductDto(product);
    });
  } catch (error) {
    if (isUniqueSlugError(error)) {
      conflict("Product slug already exists");
    }
    throw error;
  }
}

export async function hideProduct(id: string): Promise<ProductDto> {
  await requireProduct(requireId(id));

  const product = await getPrisma().product.update({
    where: { id },
    data: { isActive: false },
    include: PRODUCT_INCLUDE,
  });

  return toProductDto(product);
}

export async function deleteProduct(id: string): Promise<{ id: string }> {
  const productId = requireId(id);
  await requireProduct(productId);

  const orderItemCount = await getPrisma().orderItem.count({
    where: { productId },
  });

  if (orderItemCount > 0) {
    conflict(
      "Bu ürün sipariş geçmişinde olduğu için tamamen silinemez. Gizle seçeneğini kullanın.",
    );
  }

  await getPrisma().$transaction(async (tx) => {
    await tx.cartItem.deleteMany({ where: { productId } });
    await tx.wishlistItem.deleteMany({ where: { productId } });
    await tx.inventoryMovement.deleteMany({ where: { productId } });
    await tx.product.delete({ where: { id: productId } });
  });

  return { id: productId };
}
