import { products as sourceProducts } from "@/data/products";
import type { AdminStoreState, CategoryOverride, ProductOverride } from "@/lib/adminStore";
import { EMPTY_ADMIN_STORE } from "@/lib/adminStore";
import { CATEGORY_NAMES, type CategoryName } from "@/lib/constants";
import type { Product } from "@/types";

export const ORIGINAL_PRODUCT_IDS = new Set(sourceProducts.map((product) => product.id));

export const CATEGORY_PLACEHOLDERS: Record<CategoryName, string> = {
  "T-Shirt": "/placeholders/tshirt.svg",
  Pantolon: "/placeholders/pantolon.svg",
  "Parfüm": "/placeholders/parfum.svg",
  Kemer: "/placeholders/kemer.svg",
  "Çanta": "/placeholders/canta.svg",
  Aksesuar: "/placeholders/aksesuar.svg",
};

export function isCategoryName(value: string): value is CategoryName {
  return (CATEGORY_NAMES as readonly string[]).includes(value);
}

export function getPlaceholderForCategory(category: string): string {
  if (isCategoryName(category)) {
    return CATEGORY_PLACEHOLDERS[category];
  }

  return "/placeholders/tshirt.svg";
}

export function applyProductOverride(product: Product, override: ProductOverride): Product {
  const { hidden: _hidden, ...fields } = override;
  const merged: Product = {
    ...product,
    ...fields,
    id: product.id,
  };

  if (merged.category !== "Parfüm") {
    delete merged.perfumeDetails;
  }

  return merged;
}

export function mergeCatalog(
  base: Product[] = sourceProducts,
  store: AdminStoreState = EMPTY_ADMIN_STORE,
): Product[] {
  const seen = new Set<string>();
  const merged: Product[] = [];

  for (const product of base) {
    const override = store.productOverrides[product.id];
    if (override?.hidden) {
      continue;
    }

    merged.push(override ? applyProductOverride(product, override) : product);
    seen.add(product.id);
  }

  for (const product of store.newProducts) {
    if (seen.has(product.id)) {
      continue;
    }

    const override = store.productOverrides[product.id];
    if (override?.hidden) {
      continue;
    }

    merged.push(override ? applyProductOverride(product, override) : product);
    seen.add(product.id);
  }

  return merged;
}

export function getMergedProductById(
  id: string,
  store: AdminStoreState = EMPTY_ADMIN_STORE,
  base: Product[] = sourceProducts,
): Product | undefined {
  return mergeCatalog(base, store).find((product) => product.id === id);
}

export function getMergedProductBySlug(
  slug: string,
  store: AdminStoreState = EMPTY_ADMIN_STORE,
  base: Product[] = sourceProducts,
): Product | undefined {
  return mergeCatalog(base, store).find((product) => product.slug === slug);
}

export function getCategoryOverride(
  slug: string,
  store: AdminStoreState = EMPTY_ADMIN_STORE,
): CategoryOverride | undefined {
  return store.categoryOverrides[slug];
}

export type AdminProductRow = Product & {
  hidden: boolean;
  origin: "original" | "new";
};

export function listAdminProducts(
  store: AdminStoreState,
  base: Product[] = sourceProducts,
): AdminProductRow[] {
  const rows: AdminProductRow[] = [];
  const seen = new Set<string>();

  for (const product of base) {
    const override = store.productOverrides[product.id];
    const merged = override ? applyProductOverride(product, override) : product;
    rows.push({
      ...merged,
      hidden: Boolean(override?.hidden),
      origin: "original",
    });
    seen.add(product.id);
  }

  for (const product of store.newProducts) {
    if (seen.has(product.id)) {
      continue;
    }

    const override = store.productOverrides[product.id];
    const merged = override ? applyProductOverride(product, override) : product;
    rows.push({
      ...merged,
      hidden: Boolean(override?.hidden),
      origin: "new",
    });
  }

  return rows;
}

export function isOriginalProduct(id: string): boolean {
  return ORIGINAL_PRODUCT_IDS.has(id);
}

export function pickDiverse(items: Product[], count: number): Product[] {
  const byCategory = new Map<string, Product[]>();

  for (const item of items) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  const picked: Product[] = [];
  const categories = [...byCategory.keys()];
  let round = 0;

  while (picked.length < count) {
    let added = false;

    for (const category of categories) {
      const next = byCategory.get(category)?.[round];
      if (next) {
        picked.push(next);
        added = true;
        if (picked.length === count) {
          return picked;
        }
      }
    }

    if (!added) {
      break;
    }

    round += 1;
  }

  return picked;
}
