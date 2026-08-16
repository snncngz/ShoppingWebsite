import type { Product } from "@/types";

export const RECENT_SEARCHES_KEY = "velora-recent-searches";
export const MAX_RECENT_SEARCHES = 5;

export const POPULAR_SEARCHES = [
  "t-shirt",
  "parfüm",
  "kemer",
  "pantolon",
  "çanta",
] as const;

export function normalizeSearchQuery(query: string): string {
  return query.trim();
}

export function searchProducts(products: Product[], query: string): Product[] {
  const needle = normalizeSearchQuery(query).toLocaleLowerCase("tr-TR");

  if (!needle) {
    return [];
  }

  return products.filter((product) => {
    return (
      product.name.toLocaleLowerCase("tr-TR").includes(needle) ||
      product.category.toLocaleLowerCase("tr-TR").includes(needle) ||
      product.subcategory.toLocaleLowerCase("tr-TR").includes(needle)
    );
  });
}

export function parseRecentSearches(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const unique: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }

    const term = normalizeSearchQuery(item);
    if (!term) {
      continue;
    }

    const exists = unique.some(
      (entry) =>
        entry.toLocaleLowerCase("tr-TR") === term.toLocaleLowerCase("tr-TR"),
    );

    if (!exists) {
      unique.push(term);
    }

    if (unique.length >= MAX_RECENT_SEARCHES) {
      break;
    }
  }

  return unique;
}

export function addRecentSearch(terms: string[], query: string): string[] {
  const term = normalizeSearchQuery(query);

  if (!term) {
    return terms;
  }

  const lower = term.toLocaleLowerCase("tr-TR");
  return [
    term,
    ...terms.filter(
      (entry) => entry.toLocaleLowerCase("tr-TR") !== lower,
    ),
  ].slice(0, MAX_RECENT_SEARCHES);
}

export function getSearchHref(query: string): string {
  const term = normalizeSearchQuery(query);

  if (!term) {
    return "/arama";
  }

  return `/arama?q=${encodeURIComponent(term)}`;
}

export const SEARCH_DEBOUNCE_MS = 300;

export function firstSearchParam(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}
