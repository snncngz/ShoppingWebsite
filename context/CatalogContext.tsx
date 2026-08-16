"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { usePathname } from "next/navigation";

import { getAdminErrorMessage } from "@/lib/adminApi";
import {
  findResolvedCategory,
  getStorefrontCategoryHref,
  resolveStorefrontCategories,
  type ResolvedCategory,
} from "@/lib/catalog";
import { fetchStorefrontCatalog } from "@/lib/storefrontApi";
import { getSingletonContext } from "@/lib/singleton-context";
import type { Product } from "@/types";

type CatalogContextValue = {
  products: Product[];
  categories: ResolvedCategory[];
  hydrated: boolean;
  error: string | null;
  getById: (id: string) => Product | undefined;
  getBySlug: (slug: string) => Product | undefined;
  getResolvedCategory: (slug: string) => ResolvedCategory | undefined;
  categoryHref: (name: string) => string;
  refresh: () => void;
};

const CatalogContext = getSingletonContext<CatalogContextValue | null>(
  "__VELORA_CATALOG_CONTEXT__",
  null,
);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ResolvedCategory[]>([]);
  const [hydrated, setHydrated] = useState(isAdmin);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback((silent = false) => {
    if (isAdmin) {
      setHydrated(true);
      setError(null);
      return;
    }

    let cancelled = false;
    if (!silent) {
      setHydrated(false);
    }
    setError(null);

    void fetchStorefrontCatalog()
      .then((catalog) => {
        if (cancelled) {
          return;
        }
        setProducts(catalog.products);
        setCategories(resolveStorefrontCategories(catalog.categories));
        setError(null);
        setHydrated(true);
      })
      .catch((caught) => {
        if (cancelled) {
          return;
        }
        setProducts([]);
        setCategories([]);
        setError(getAdminErrorMessage(caught));
        setHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  useEffect(() => {
    const cancel = refresh();
    return cancel;
  }, [refresh]);

  useEffect(() => {
    if (isAdmin) {
      return;
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refresh(true);
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isAdmin, refresh]);

  const value = useMemo<CatalogContextValue>(
    () => ({
      products,
      categories,
      hydrated,
      error,
      getById: (id: string) => products.find((product) => product.id === id),
      getBySlug: (slug: string) =>
        products.find((product) => product.slug === slug),
      getResolvedCategory: (slug: string) =>
        findResolvedCategory(slug, categories),
      categoryHref: (name: string) =>
        getStorefrontCategoryHref(name, categories),
      refresh: () => {
        refresh();
      },
    }),
    [categories, error, hydrated, products, refresh],
  );

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog(): CatalogContextValue {
  const context = useContext(CatalogContext);

  if (!context) {
    throw new Error("useCatalog must be used within CatalogProvider");
  }

  return context;
}
