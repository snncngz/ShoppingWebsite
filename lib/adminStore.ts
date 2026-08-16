import type { Product } from "@/types";

export const ADMIN_SESSION_KEY = "velora-admin-session";
export const ADMIN_PRODUCT_OVERRIDES_KEY = "velora-admin-product-overrides";
export const ADMIN_NEW_PRODUCTS_KEY = "velora-admin-new-products";
export const ADMIN_CATEGORY_OVERRIDES_KEY = "velora-admin-category-overrides";
export const ADMIN_NEW_CATEGORIES_KEY = "velora-admin-new-categories";
export const CATALOG_CHANGE_EVENT = "velora-catalog-change";

export type ProductOverride = Partial<Omit<Product, "id">> & {
  hidden?: boolean;
};

export type CategoryOverride = {
  title?: string;
  description?: string;
  hidden?: boolean;
};

export type AdminCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
};

export type AdminStoreState = {
  productOverrides: Record<string, ProductOverride>;
  newProducts: Product[];
  categoryOverrides: Record<string, CategoryOverride>;
  newCategories: AdminCategory[];
};

export const EMPTY_ADMIN_STORE: AdminStoreState = {
  productOverrides: {},
  newProducts: [],
  categoryOverrides: {},
  newCategories: [],
};

export function notifyCatalogChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(CATALOG_CHANGE_EVENT));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.filter((item): item is string => typeof item === "string");
}

function parseProduct(value: unknown): Product | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.slug !== "string" ||
    typeof value.name !== "string" ||
    typeof value.category !== "string" ||
    typeof value.subcategory !== "string" ||
    typeof value.price !== "number" ||
    typeof value.description !== "string" ||
    typeof value.stock !== "number" ||
    typeof value.rating !== "number" ||
    typeof value.reviewCount !== "number" ||
    typeof value.isPopular !== "boolean" ||
    typeof value.isNew !== "boolean"
  ) {
    return null;
  }

  const images = asStringArray(value.images);
  const colors = asStringArray(value.colors);
  const sizes = asStringArray(value.sizes);

  if (!images || !colors || !sizes) {
    return null;
  }

  const product: Product = {
    id: value.id,
    slug: value.slug,
    name: value.name,
    category: value.category,
    subcategory: value.subcategory,
    price: value.price,
    description: value.description,
    images,
    colors,
    sizes,
    stock: value.stock,
    rating: value.rating,
    reviewCount: value.reviewCount,
    isPopular: value.isPopular,
    isNew: value.isNew,
  };

  if (typeof value.oldPrice === "number") {
    product.oldPrice = value.oldPrice;
  }

  if (typeof value.discount === "number") {
    product.discount = value.discount;
  }

  if (typeof value.badge === "string") {
    product.badge = value.badge;
  }

  if (isRecord(value.perfumeDetails)) {
    const volume = asStringArray(value.perfumeDetails.volume);
    const topNotes = asStringArray(value.perfumeDetails.topNotes);
    const heartNotes = asStringArray(value.perfumeDetails.heartNotes);
    const baseNotes = asStringArray(value.perfumeDetails.baseNotes);

    if (
      volume &&
      topNotes &&
      heartNotes &&
      baseNotes &&
      typeof value.perfumeDetails.fragranceFamily === "string"
    ) {
      product.perfumeDetails = {
        volume,
        fragranceFamily: value.perfumeDetails.fragranceFamily,
        topNotes,
        heartNotes,
        baseNotes,
      };
    }
  }

  return product;
}

function parseAdminCategory(value: unknown): AdminCategory | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.slug !== "string" ||
    typeof value.name !== "string" ||
    typeof value.description !== "string" ||
    typeof value.image !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    slug: value.slug,
    name: value.name,
    description: value.description,
    image: value.image,
  };
}

function parseProductOverride(value: unknown): ProductOverride | null {
  if (!isRecord(value)) {
    return null;
  }

  const parsed = parseProduct({
    id: "override",
    slug: typeof value.slug === "string" ? value.slug : "override",
    name: typeof value.name === "string" ? value.name : "override",
    category: typeof value.category === "string" ? value.category : "T-Shirt",
    subcategory:
      typeof value.subcategory === "string" ? value.subcategory : "Essential",
    price: typeof value.price === "number" ? value.price : 0,
    description: typeof value.description === "string" ? value.description : "",
    images: Array.isArray(value.images) ? value.images : ["/placeholders/tshirt.svg"],
    colors: Array.isArray(value.colors) ? value.colors : ["Siyah"],
    sizes: Array.isArray(value.sizes) ? value.sizes : ["M"],
    stock: typeof value.stock === "number" ? value.stock : 0,
    rating: typeof value.rating === "number" ? value.rating : 0,
    reviewCount: typeof value.reviewCount === "number" ? value.reviewCount : 0,
    isPopular: typeof value.isPopular === "boolean" ? value.isPopular : false,
    isNew: typeof value.isNew === "boolean" ? value.isNew : false,
    oldPrice: value.oldPrice,
    discount: value.discount,
    badge: value.badge,
    perfumeDetails: value.perfumeDetails,
  });

  const override: ProductOverride = {};

  if (typeof value.hidden === "boolean") {
    override.hidden = value.hidden;
  }

  if (!parsed) {
    return Object.keys(override).length > 0 ? override : null;
  }

  if (typeof value.slug === "string") override.slug = value.slug;
  if (typeof value.name === "string") override.name = value.name;
  if (typeof value.category === "string") override.category = value.category;
  if (typeof value.subcategory === "string") override.subcategory = value.subcategory;
  if (typeof value.price === "number") override.price = value.price;
  if (typeof value.oldPrice === "number") override.oldPrice = value.oldPrice;
  if (typeof value.discount === "number") override.discount = value.discount;
  if (typeof value.description === "string") override.description = value.description;
  if (Array.isArray(value.images)) override.images = parsed.images;
  if (Array.isArray(value.colors)) override.colors = parsed.colors;
  if (Array.isArray(value.sizes)) override.sizes = parsed.sizes;
  if (typeof value.stock === "number") override.stock = value.stock;
  if (typeof value.rating === "number") override.rating = value.rating;
  if (typeof value.reviewCount === "number") override.reviewCount = value.reviewCount;
  if (typeof value.isPopular === "boolean") override.isPopular = value.isPopular;
  if (typeof value.isNew === "boolean") override.isNew = value.isNew;
  if (typeof value.badge === "string") override.badge = value.badge;
  if (value.perfumeDetails && parsed.perfumeDetails) {
    override.perfumeDetails = parsed.perfumeDetails;
  }

  return Object.keys(override).length > 0 ? override : null;
}

function readJson(key: string): unknown {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadAdminStore(): AdminStoreState {
  const overridesRaw = readJson(ADMIN_PRODUCT_OVERRIDES_KEY);
  const newRaw = readJson(ADMIN_NEW_PRODUCTS_KEY);
  const categoriesRaw = readJson(ADMIN_CATEGORY_OVERRIDES_KEY);
  const newCategoriesRaw = readJson(ADMIN_NEW_CATEGORIES_KEY);

  const productOverrides: Record<string, ProductOverride> = {};
  if (isRecord(overridesRaw)) {
    for (const [id, value] of Object.entries(overridesRaw)) {
      const parsed = parseProductOverride(value);
      if (parsed) {
        productOverrides[id] = parsed;
      }
    }
  }

  const newProducts = Array.isArray(newRaw)
    ? newRaw
        .map((item) => parseProduct(item))
        .filter((item): item is Product => Boolean(item))
    : [];

  const categoryOverrides: Record<string, CategoryOverride> = {};
  if (isRecord(categoriesRaw)) {
    for (const [id, value] of Object.entries(categoriesRaw)) {
      if (!isRecord(value)) {
        continue;
      }

      const override: CategoryOverride = {};
      if (typeof value.title === "string") override.title = value.title;
      if (typeof value.description === "string") override.description = value.description;
      if (typeof value.hidden === "boolean") override.hidden = value.hidden;
      if (Object.keys(override).length > 0) {
        categoryOverrides[id] = override;
      }
    }
  }

  const newCategories = Array.isArray(newCategoriesRaw)
    ? newCategoriesRaw
        .map((item) => parseAdminCategory(item))
        .filter((item): item is AdminCategory => Boolean(item))
    : [];

  return { productOverrides, newProducts, categoryOverrides, newCategories };
}

export function saveAdminStore(next: AdminStoreState) {
  writeJson(ADMIN_PRODUCT_OVERRIDES_KEY, next.productOverrides);
  writeJson(ADMIN_NEW_PRODUCTS_KEY, next.newProducts);
  writeJson(ADMIN_CATEGORY_OVERRIDES_KEY, next.categoryOverrides);
  writeJson(ADMIN_NEW_CATEGORIES_KEY, next.newCategories);
  notifyCatalogChange();
}

export function commitAdminStore(
  mutator: (store: AdminStoreState) => AdminStoreState,
) {
  saveAdminStore(mutator(loadAdminStore()));
}

export function clearAdminStore() {
  window.localStorage.removeItem(ADMIN_PRODUCT_OVERRIDES_KEY);
  window.localStorage.removeItem(ADMIN_NEW_PRODUCTS_KEY);
  window.localStorage.removeItem(ADMIN_CATEGORY_OVERRIDES_KEY);
  window.localStorage.removeItem(ADMIN_NEW_CATEGORIES_KEY);
  notifyCatalogChange();
}

export function upsertProductOverride(
  store: AdminStoreState,
  productId: string,
  patch: ProductOverride,
): AdminStoreState {
  return {
    ...store,
    productOverrides: {
      ...store.productOverrides,
      [productId]: {
        ...store.productOverrides[productId],
        ...patch,
      },
    },
  };
}

export function removeProductOverride(store: AdminStoreState, productId: string): AdminStoreState {
  const next = { ...store.productOverrides };
  delete next[productId];
  return { ...store, productOverrides: next };
}
