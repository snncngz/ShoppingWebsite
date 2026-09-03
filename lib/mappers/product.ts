import type { PerfumeDetails, Product } from "@/types";
import type { ProductDto } from "@/types/api";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export function toPerfumeDetails(value: unknown): PerfumeDetails | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.fragranceFamily !== "string") {
    return undefined;
  }

  return {
    volume: asStringArray(record.volume),
    fragranceFamily: record.fragranceFamily,
    topNotes: asStringArray(record.topNotes),
    heartNotes: asStringArray(record.heartNotes),
    baseNotes: asStringArray(record.baseNotes),
  };
}

export function toStorefrontProduct(dto: ProductDto): Product {
  const parent = dto.category.parent;
  const product: Product = {
    id: dto.id,
    slug: dto.slug,
    name: dto.name,
    category: parent?.name ?? dto.category.name,
    categorySlug: parent?.slug ?? dto.category.slug,
    categoryLeafSlug: dto.category.slug,
    subcategory: parent ? dto.category.name : dto.subcategory,
    price: dto.price,
    description: dto.description,
    images: dto.images,
    colors: dto.colors,
    sizes: dto.sizes,
    stock: dto.stock,
    rating: dto.rating,
    reviewCount: dto.reviewCount,
    isPopular: dto.isPopular,
    isNew: dto.isNew,
  };

  if (dto.oldPrice != null) {
    product.oldPrice = dto.oldPrice;
  }

  if (dto.discount != null) {
    product.discount = dto.discount;
  }

  if (dto.badge) {
    product.badge = dto.badge;
  }

  const perfumeDetails = toPerfumeDetails(dto.perfumeDetails);
  if (perfumeDetails) {
    product.perfumeDetails = perfumeDetails;
  }

  return product;
}
