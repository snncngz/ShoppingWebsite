import { CLOTHING_SIZES, getPerfumeGender, PERFUME_GENDERS, PERFUME_VOLUMES } from "@/lib/category-pages";
import type { Product } from "@/types";

export const SORT_OPTIONS = [
  { value: "recommended", label: "Önerilen" },
  { value: "new", label: "Yeni Gelenler" },
  { value: "popular", label: "Çok Satanlar" },
  { value: "price-asc", label: "Fiyat: Düşükten Yükseğe" },
  { value: "price-desc", label: "Fiyat: Yüksekten Düşüğe" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export type ApiSortValue = "price_asc" | "price_desc" | "newest" | "name_asc";

export function toApiSort(sort: SortValue): ApiSortValue {
  switch (sort) {
    case "price-asc":
      return "price_asc";
    case "price-desc":
      return "price_desc";
    default:
      return "newest";
  }
}

export type StockFilter = "in" | "out";

export type FilterState = {
  subcategories: string[];
  colors: string[];
  sizes: string[];
  stock: StockFilter[];
  genders: string[];
  volumes: string[];
  priceMin: number | null;
  priceMax: number | null;
};

export type FilterOptions = {
  subcategories: string[];
  colors: string[];
  sizes: string[];
  genders: string[];
  volumes: string[];
  priceBounds: {
    min: number;
    max: number;
  } | null;
};

export function createEmptyFilters(): FilterState {
  return {
    subcategories: [],
    colors: [],
    sizes: [],
    stock: [],
    genders: [],
    volumes: [],
    priceMin: null,
    priceMax: null,
  };
}

export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.subcategories.length > 0 ||
    filters.colors.length > 0 ||
    filters.sizes.length > 0 ||
    filters.stock.length > 0 ||
    filters.genders.length > 0 ||
    filters.volumes.length > 0 ||
    filters.priceMin !== null ||
    filters.priceMax !== null
  );
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "tr"));
}

export function getFilterOptions(
  products: Product[],
  config: { showClothingSizes: boolean; showPerfumeFilters: boolean },
): FilterOptions {
  const prices = products.map((product) => product.price);
  const volumesFromProducts = products.flatMap(
    (product) => product.perfumeDetails?.volume ?? [],
  );

  const sizes = config.showClothingSizes
    ? uniqueSorted([...CLOTHING_SIZES, ...products.flatMap((product) => product.sizes)])
    : uniqueSorted(products.flatMap((product) => product.sizes));

  return {
    subcategories: uniqueSorted(products.map((product) => product.subcategory)),
    colors: uniqueSorted(products.flatMap((product) => product.colors)),
    sizes,
    genders: config.showPerfumeFilters ? [...PERFUME_GENDERS] : [],
    volumes: config.showPerfumeFilters
      ? uniqueSorted([...PERFUME_VOLUMES, ...volumesFromProducts])
      : [],
    priceBounds:
      prices.length > 0
        ? { min: Math.min(...prices), max: Math.max(...prices) }
        : null,
  };
}

function matchesStock(product: Product, stock: StockFilter[]): boolean {
  if (stock.length === 0 || stock.length === 2) {
    return true;
  }

  if (stock.includes("in")) {
    return product.stock > 0;
  }

  return product.stock === 0;
}

function matchesVolume(product: Product, volumes: string[]): boolean {
  if (volumes.length === 0) {
    return true;
  }

  const productVolumes = product.perfumeDetails?.volume ?? product.sizes;
  return volumes.some((volume) => productVolumes.includes(volume));
}

export function filterProducts(products: Product[], filters: FilterState): Product[] {
  return products.filter((product) => {
    if (
      filters.subcategories.length > 0 &&
      !filters.subcategories.includes(product.subcategory)
    ) {
      return false;
    }

    if (
      filters.colors.length > 0 &&
      !filters.colors.some((color) => product.colors.includes(color))
    ) {
      return false;
    }

    if (
      filters.sizes.length > 0 &&
      !filters.sizes.some((size) => product.sizes.includes(size))
    ) {
      return false;
    }

    if (!matchesStock(product, filters.stock)) {
      return false;
    }

    if (filters.genders.length > 0) {
      const gender = getPerfumeGender(product);
      if (!gender || !filters.genders.includes(gender)) {
        return false;
      }
    }

    if (!matchesVolume(product, filters.volumes)) {
      return false;
    }

    if (filters.priceMin !== null && product.price < filters.priceMin) {
      return false;
    }

    if (filters.priceMax !== null && product.price > filters.priceMax) {
      return false;
    }

    return true;
  });
}

export function sortProducts(
  products: Product[],
  sort: SortValue,
  catalogOrder: Product[],
): Product[] {
  const order = new Map(catalogOrder.map((product, index) => [product.id, index]));
  const copy = [...products];

  const byCatalog = (a: Product, b: Product) =>
    (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0);

  switch (sort) {
    case "new":
      return copy.sort(
        (a, b) => Number(b.isNew) - Number(a.isNew) || byCatalog(a, b),
      );
    case "popular":
      return copy.sort(
        (a, b) =>
          Number(b.isPopular) - Number(a.isPopular) ||
          b.reviewCount - a.reviewCount ||
          byCatalog(a, b),
      );
    case "price-asc":
      return copy.sort((a, b) => a.price - b.price || byCatalog(a, b));
    case "price-desc":
      return copy.sort((a, b) => b.price - a.price || byCatalog(a, b));
    default:
      return copy.sort(byCatalog);
  }
}

export function toggleFilterValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}
