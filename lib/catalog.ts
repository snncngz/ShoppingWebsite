import { products as sourceProducts } from "@/data/products";
import type { AdminStoreState, CategoryOverride, ProductOverride } from "@/lib/adminStore";
import { EMPTY_ADMIN_STORE } from "@/lib/adminStore";
import {
  CATEGORY_SLUGS,
  categoryPages,
  type BreadcrumbItem,
} from "@/lib/category-pages";
import { CATEGORY_NAMES, type CategoryName } from "@/lib/constants";
import type { DesktopNavItem, NavLink } from "@/lib/navigation";
import type { Product } from "@/types";
import type { CategoryDto } from "@/types/api";

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

export const RESERVED_CATEGORY_SLUGS = new Set([
  ...CATEGORY_SLUGS,
  "admin",
  "api",
  "giris",
  "kayit",
  "hesabim",
  "sepet",
  "favoriler",
  "checkout",
  "arama",
  "siparislerim",
  "hakkimizda",
  "iletisim",
  "sss",
  "urun",
  "giyim",
  "kargo-ve-teslimat",
  "iade-ve-degisim",
  "gizlilik-politikasi",
  "kvkk",
  "cerez-politikasi",
  "mesafeli-satis-sozlesmesi",
]);

export type ResolvedCategory = {
  slug: string;
  title: string;
  name: string;
  description: string;
  href: string;
  image: string;
  origin: "original" | "new" | "child";
  hidden: boolean;
  parentSlug: string | null;
  children: { slug: string; title: string; href: string }[];
  showPerfumeFilters: boolean;
  showClothingSizes: boolean;
  breadcrumbs: BreadcrumbItem[];
  match: (product: Product) => boolean;
};

function hrefFromSlug(slug: string): string {
  return `/${slug}`;
}

export function slugFromHref(href: string): string | null {
  const path = href.split("?")[0];
  if (!path.startsWith("/") || path === "/") {
    return null;
  }

  const slug = path.slice(1).replace(/\/$/, "");
  if (!slug) {
    return null;
  }

  return slug;
}

export function listResolvedCategories(
  store: AdminStoreState = EMPTY_ADMIN_STORE,
): ResolvedCategory[] {
  const original = CATEGORY_SLUGS.map((slug) => {
    const config = categoryPages[slug];
    const override = store.categoryOverrides[slug];
    const title = override?.title ?? config.title;

    return {
      slug,
      title,
      name: config.title,
      description: override?.description ?? config.description,
      href: hrefFromSlug(slug),
      image: getPlaceholderForCategory(config.title),
      origin: "original" as const,
      hidden: Boolean(override?.hidden),
      parentSlug: null,
      children: [],
      showPerfumeFilters: config.showPerfumeFilters,
      showClothingSizes: config.showClothingSizes,
      breadcrumbs: [
        { label: "Anasayfa", href: "/" },
        { label: title, href: hrefFromSlug(slug) },
      ],
      match: config.match,
    };
  });

  const created = store.newCategories.map((category) => {
    const override = store.categoryOverrides[category.slug];
    const title = override?.title ?? category.name;

    return {
      slug: category.slug,
      title,
      name: category.name,
      description: override?.description ?? category.description,
      href: hrefFromSlug(category.slug),
      image: category.image || getPlaceholderForCategory(category.name),
      origin: "new" as const,
      hidden: Boolean(override?.hidden),
      parentSlug: null,
      children: [],
      showPerfumeFilters: category.name === "Parfüm" || title === "Parfüm",
      showClothingSizes: false,
      breadcrumbs: [
        { label: "Anasayfa", href: "/" },
        { label: title, href: hrefFromSlug(category.slug) },
      ],
      match: (product: Product) =>
        product.category === category.name || product.category === title,
    };
  });

  return [...original, ...created];
}

export function getResolvedCategory(
  slug: string,
  store: AdminStoreState = EMPTY_ADMIN_STORE,
): ResolvedCategory | undefined {
  return listResolvedCategories(store).find((category) => category.slug === slug);
}

export const VIRTUAL_CATEGORY_SLUGS = new Set(["yeni-gelenler", "cok-satanlar"]);

function activeChildren(
  api: CategoryDto | undefined,
  parentSlug: string,
): { slug: string; title: string; href: string }[] {
  return (api?.children ?? [])
    .filter((child) => child.isActive)
    .map((child) => ({
      slug: child.slug,
      title: child.name,
      href: `/${parentSlug}/${child.slug}`,
    }));
}

function productInCategory(
  product: Product,
  slug: string,
  names: string[],
): boolean {
  if (product.categorySlug === slug || product.categoryLeafSlug === slug) {
    return true;
  }
  return names.some(
    (name) => product.category === name || product.subcategory === name,
  );
}

export function resolveStorefrontCategories(
  apiCategories: CategoryDto[],
): ResolvedCategory[] {
  const usedIds = new Set<string>();

  const originals = CATEGORY_SLUGS.map((slug) => {
    const config = categoryPages[slug];
    const api =
      apiCategories.find((item) => item.slug === slug) ??
      apiCategories.find((item) => item.name === config.title);

    if (api) {
      usedIds.add(api.id);
      for (const child of api.children) {
        usedIds.add(child.id);
      }
    }

    const title = api?.name ?? config.title;
    const description = api?.description?.trim()
      ? api.description
      : config.description;
    const children = activeChildren(api, slug);

    return {
      slug,
      title,
      name: config.title,
      description,
      href: hrefFromSlug(slug),
      image: getPlaceholderForCategory(title),
      origin: "original" as const,
      hidden: VIRTUAL_CATEGORY_SLUGS.has(slug)
        ? false
        : api
          ? !api.isActive
          : false,
      parentSlug: null,
      children,
      showPerfumeFilters: config.showPerfumeFilters,
      showClothingSizes: config.showClothingSizes,
      breadcrumbs: [
        { label: "Anasayfa", href: "/" },
        { label: title, href: hrefFromSlug(slug) },
      ],
      match: (product: Product) =>
        productInCategory(product, slug, [title, config.title, api?.name ?? ""]) ||
        config.match(product),
    };
  });

  const extras = apiCategories
    .filter((category) => category.isActive && !usedIds.has(category.id))
    .filter((category) => !category.parentId)
    .filter((category) => !isReservedCategorySlug(category.slug))
    .map((category) => {
      const title = category.name;
      const children = activeChildren(category, category.slug);
      for (const child of category.children) {
        usedIds.add(child.id);
      }

      return {
        slug: category.slug,
        title,
        name: category.name,
        description: category.description,
        href: hrefFromSlug(category.slug),
        image: getPlaceholderForCategory(category.name),
        origin: "new" as const,
        hidden: false,
        parentSlug: null,
        children,
        showPerfumeFilters: category.name === "Parfüm" || title === "Parfüm",
        showClothingSizes: false,
        breadcrumbs: [
          { label: "Anasayfa", href: "/" },
          { label: title, href: hrefFromSlug(category.slug) },
        ],
        match: (product: Product) =>
          productInCategory(product, category.slug, [category.name, title]),
      };
    });

  const parents = [...originals, ...extras];
  const childPages = parents.flatMap((parent) =>
    parent.children.map((child) => {
      const apiChild = apiCategories.find((item) => item.slug === child.slug);
      return {
        slug: child.slug,
        title: child.title,
        name: child.title,
        description: apiChild?.description ?? "",
        href: child.href,
        image: parent.image,
        origin: "child" as const,
        hidden: false,
        parentSlug: parent.slug,
        children: [],
        showPerfumeFilters: parent.showPerfumeFilters,
        showClothingSizes: parent.showClothingSizes,
        breadcrumbs: [
          { label: "Anasayfa", href: "/" },
          { label: parent.title, href: parent.href },
          { label: child.title, href: child.href },
        ],
        match: (product: Product) =>
          product.categoryLeafSlug === child.slug ||
          product.subcategory === child.title,
      };
    }),
  );

  return [...parents, ...childPages];
}

export function findResolvedCategory(
  slug: string,
  categories: ResolvedCategory[],
): ResolvedCategory | undefined {
  const normalized = slug.replace(/^\/+|\/+$/g, "");
  return categories.find(
    (category) =>
      category.slug === normalized ||
      category.href === `/${normalized}` ||
      (category.parentSlug &&
        `${category.parentSlug}/${category.slug}` === normalized),
  );
}

export function isCategoryHidden(
  slug: string,
  store: AdminStoreState = EMPTY_ADMIN_STORE,
): boolean {
  return Boolean(getResolvedCategory(slug, store)?.hidden);
}

export function isStorefrontHrefVisible(
  href: string,
  categories: ResolvedCategory[],
): boolean {
  const slug = slugFromHref(href);
  if (!slug) {
    return true;
  }

  const category = findResolvedCategory(slug, categories);
  if (!category) {
    return true;
  }

  return !category.hidden;
}

export function getVisibleCategories(
  categories: ResolvedCategory[],
): ResolvedCategory[] {
  return categories.filter((category) => !category.hidden);
}

export function getAdminCategoryNames(
  store: AdminStoreState = EMPTY_ADMIN_STORE,
): string[] {
  const names = [
    ...CATEGORY_NAMES,
    ...store.newCategories.map((category) => category.name),
  ];
  return [...new Set(names)];
}

export function getStorefrontCategoryHref(
  categoryName: string,
  categories: ResolvedCategory[],
): string {
  const match = categories.find(
    (category) =>
      category.name === categoryName || category.title === categoryName,
  );

  if (!match || match.hidden) {
    return "/";
  }

  return match.href;
}

export function filterDesktopNav(
  items: DesktopNavItem[],
  categories: ResolvedCategory[],
): DesktopNavItem[] {
  const filtered = items.flatMap((item) => {
    if (!isStorefrontHrefVisible(item.href, categories)) {
      return [];
    }

    if (!item.mega) {
      return [item];
    }

    const slug = slugFromHref(item.href);
    const self = slug ? findResolvedCategory(slug, categories) : undefined;
    const fromChildren =
      self && self.children.length > 0
        ? [
            ...self.children.map((child) => ({
              label: child.title,
              href: child.href,
            })),
            ...item.mega.items.filter(
              (entry) =>
                entry.href === "/yeni-gelenler" || entry.href === "/cok-satanlar",
            ),
          ]
        : null;

    const megaItems = (fromChildren ?? item.mega.items).filter((entry) =>
      isStorefrontHrefVisible(entry.href, categories),
    );

    if (megaItems.length === 0) {
      const slug = slugFromHref(item.href);
      const self = slug ? findResolvedCategory(slug, categories) : undefined;
      if (self && !self.hidden) {
        return [{ ...item, mega: undefined }];
      }

      return [];
    }

    return [
      {
        ...item,
        mega: { ...item.mega, items: megaItems },
      },
    ];
  });

  const extras: DesktopNavItem[] = getVisibleCategories(categories)
    .filter((category) => category.origin === "new")
    .map((category) => ({
      id: category.slug,
      label: category.title,
      href: category.href,
      mega:
        category.children.length > 0
          ? {
              id: category.slug,
              label: category.title,
              href: category.href,
              items: category.children.map((child) => ({
                label: child.title,
                href: child.href,
              })),
              image: {
                src: category.image,
                alt: category.title,
                caption: category.title,
              },
            }
          : undefined,
    }));

  return [...filtered, ...extras];
}

export function filterNavLinks(
  links: NavLink[],
  categories: ResolvedCategory[],
): NavLink[] {
  const visible = links.filter((link) =>
    isStorefrontHrefVisible(link.href, categories),
  );
  const extras = getVisibleCategories(categories)
    .filter((category) => category.origin === "new")
    .map((category) => ({ label: category.title, href: category.href }));

  const existing = new Set(visible.map((link) => link.href));
  return [
    ...visible,
    ...extras.filter((link) => !existing.has(link.href)),
  ];
}

export function isReservedCategorySlug(slug: string): boolean {
  return RESERVED_CATEGORY_SLUGS.has(slug) || slug.startsWith("admin");
}
