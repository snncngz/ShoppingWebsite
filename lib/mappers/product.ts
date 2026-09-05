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
  const fragranceFamily =
    typeof record.fragranceFamily === "string" ? record.fragranceFamily : "";

  const volumePrices = Array.isArray(record.volumePrices)
    ? record.volumePrices.flatMap((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
          return [];
        }
        const row = entry as Record<string, unknown>;
        const price =
          typeof row.price === "number"
            ? row.price
            : typeof row.price === "string"
              ? Number(row.price)
              : NaN;
        if (typeof row.volume !== "string" || !Number.isFinite(price) || price <= 0) {
          return [];
        }
        const oldRaw =
          typeof row.oldPrice === "number"
            ? row.oldPrice
            : typeof row.oldPrice === "string"
              ? Number(row.oldPrice)
              : undefined;
        const oldPrice =
          oldRaw !== undefined && Number.isFinite(oldRaw) && oldRaw > price
            ? oldRaw
            : undefined;
        return [
          {
            volume: row.volume,
            price,
            oldPrice,
          },
        ];
      })
    : undefined;

  const volume = asStringArray(record.volume);
  const volumes =
    volume.length > 0
      ? volume
      : (volumePrices ?? []).map((row) => row.volume);

  if (!fragranceFamily && volumes.length === 0 && !(volumePrices && volumePrices.length > 0)) {
    return undefined;
  }

  return {
    volume: volumes,
    volumePrices,
    fragranceFamily: fragranceFamily || "Odunsu",
    topNotes: asStringArray(record.topNotes),
    heartNotes: asStringArray(record.heartNotes),
    baseNotes: asStringArray(record.baseNotes),
  };
}

export function toStorefrontProduct(dto: ProductDto): Product {
  const path = [dto.category.parent?.parent, dto.category.parent, dto.category].filter(
    (item): item is NonNullable<typeof item> => Boolean(item),
  );
  const root = path[0] ?? dto.category;
  const leaf = path[path.length - 1] ?? dto.category;
  const product: Product = {
    id: dto.id,
    slug: dto.slug,
    name: dto.name,
    category: root.name,
    categorySlug: root.slug,
    categoryLeafSlug: leaf.slug,
    subcategory: path.length > 1 ? leaf.name : dto.subcategory,
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

  if (dto.campaignPercent != null && dto.campaignPercent > 0) {
    product.campaignPercent = dto.campaignPercent;
  }

  const perfumeDetails = toPerfumeDetails(dto.perfumeDetails);
  if (perfumeDetails) {
    product.perfumeDetails = perfumeDetails;
  }

  return product;
}
