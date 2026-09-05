import { adminRequest } from "@/lib/adminApi";
import { listAdminApiCategories } from "@/lib/adminCategories";
import { toSlug } from "@/lib/utils";
import { toPerfumeDetails } from "@/lib/mappers/product";
import type { PerfumeDetails } from "@/types";
import type { CategoryDto, PaginatedDto, ProductDto } from "@/types/api";

export type AdminProductListItem = {
  id: string;
  name: string;
  slug: string;
  category: string;
  categoryId: string;
  price: number;
  stock: number;
  hidden: boolean;
};

export type AdminProductWriteInput = {
  name: string;
  slug: string;
  description: string;
  price: number;
  oldPrice?: number | null;
  discount?: number | null;
  stock: number;
  subcategory: string;
  images: string[];
  colors: string[];
  sizes: string[];
  isPopular: boolean;
  isNew: boolean;
  badge?: string | null;
  campaignPercent?: number | null;
  perfumeDetails?: PerfumeDetails;
  categoryId?: string;
  categoryName: string;
  rating?: number;
  reviewCount?: number;
};

const PRODUCT_PAGE_SIZE = 100;

async function fetchProductPages(isActive: boolean): Promise<ProductDto[]> {
  const items: ProductDto[] = [];
  let page = 1;
  let totalPages = 0;

  do {
    const data = await adminRequest<PaginatedDto<ProductDto>>(
      `/api/products?page=${page}&limit=${PRODUCT_PAGE_SIZE}&isActive=${isActive}&sort=newest`,
    );
    items.push(...data.items);
    totalPages = data.pagination.totalPages;
    page += 1;
  } while (totalPages > 0 && page <= totalPages);

  return items;
}

export function toAdminProductListItem(product: ProductDto): AdminProductListItem {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category.parent
      ? `${product.category.parent.name} / ${product.category.name}`
      : product.category.name,
    categoryId: product.categoryId,
    price: product.price,
    stock: product.stock,
    hidden: !product.isActive,
  };
}

export async function listAdminApiProducts(): Promise<AdminProductListItem[]> {
  const [active, inactive] = await Promise.all([
    fetchProductPages(true),
    fetchProductPages(false),
  ]);

  return [...active, ...inactive]
    .map(toAdminProductListItem)
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

export async function getAdminApiProduct(id: string): Promise<ProductDto> {
  return adminRequest<ProductDto>(`/api/products/${id}`);
}

async function resolveCategoryId(name: string, subcategory?: string): Promise<string> {
  const slug = toSlug(name) || "kategori";
  const categories = await listAdminApiCategories();
  const match = categories.find(
    (category) =>
      !category.parentId &&
      (category.name === name || category.slug === slug),
  );
  if (match) {
    const wanted = subcategory?.trim();
    if (wanted) {
      const child = match.children.find(
        (item) =>
          item.isActive &&
          (item.name === wanted || item.slug === toSlug(wanted)),
      );
      if (child) {
        return child.id;
      }
    }
    return match.id;
  }

  try {
    const created = await adminRequest<CategoryDto>("/api/categories", {
      method: "POST",
      body: JSON.stringify({
        name,
        slug,
        description: "",
        isActive: true,
      }),
    });
    return created.id;
  } catch (error) {
    const again = await listAdminApiCategories();
    const retry = again.find(
      (category) =>
        !category.parentId &&
        (category.name === name || category.slug === slug),
    );
    if (retry) {
      return retry.id;
    }
    throw error;
  }
}

function toProductBody(
  input: AdminProductWriteInput,
  categoryId: string,
  mode: "create" | "update",
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: input.name,
    slug: input.slug,
    description: input.description,
    price: input.price,
    stock: input.stock,
    subcategory: input.subcategory,
    images: input.images,
    colors: input.colors,
    sizes: input.sizes,
    isPopular: input.isPopular,
    isNew: input.isNew,
    categoryId,
  };

  if (input.badge) {
    body.badge = input.badge;
  } else if (mode === "update") {
    body.badge = null;
  }

  if (input.oldPrice != null) {
    body.oldPrice = input.oldPrice;
  } else if (mode === "update") {
    body.oldPrice = null;
  }

  if (input.discount != null) {
    body.discount = input.discount;
  } else if (mode === "update") {
    body.discount = null;
  }

  if (input.campaignPercent != null) {
    body.campaignPercent = input.campaignPercent;
  } else if (mode === "update") {
    body.campaignPercent = null;
  }

  if (input.rating !== undefined) {
    body.rating = input.rating;
  }

  if (input.reviewCount !== undefined) {
    body.reviewCount = input.reviewCount;
  }

  if (input.perfumeDetails) {
    body.perfumeDetails = input.perfumeDetails;
  }

  return body;
}

export async function createAdminApiProduct(
  input: AdminProductWriteInput,
): Promise<ProductDto> {
  const categoryId =
    input.categoryId ??
    (await resolveCategoryId(input.categoryName, input.subcategory));
  return adminRequest<ProductDto>("/api/products", {
    method: "POST",
    body: JSON.stringify({
      ...toProductBody(input, categoryId, "create"),
      isActive: true,
    }),
  });
}

export async function updateAdminApiProduct(
  id: string,
  input: AdminProductWriteInput,
): Promise<ProductDto> {
  const categoryId =
    input.categoryId ??
    (await resolveCategoryId(input.categoryName, input.subcategory));
  return adminRequest<ProductDto>(`/api/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(toProductBody(input, categoryId, "update")),
  });
}

export async function setAdminApiProductActive(
  id: string,
  isActive: boolean,
): Promise<ProductDto> {
  return adminRequest<ProductDto>(`/api/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

export async function deleteAdminApiProduct(id: string): Promise<{ id: string }> {
  return adminRequest<{ id: string }>(`/api/products/${id}`, {
    method: "DELETE",
  });
}

export async function uploadAdminProductImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const data = await adminRequest<{ url: string }>("/api/admin/uploads", {
    method: "POST",
    body,
  });
  return data.url;
}

export function readPerfumeDetails(value: unknown): PerfumeDetails | undefined {
  return toPerfumeDetails(value);
}
