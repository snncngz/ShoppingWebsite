"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { products as sourceProducts } from "@/data/products";
import {
  CATALOG_CHANGE_EVENT,
  EMPTY_ADMIN_STORE,
  loadAdminStore,
  type AdminStoreState,
  type CategoryOverride,
} from "@/lib/adminStore";
import {
  getCategoryOverride as readCategoryOverride,
  getMergedProductById,
  getMergedProductBySlug,
  mergeCatalog,
} from "@/lib/catalog";
import { getSingletonContext } from "@/lib/singleton-context";
import type { Product } from "@/types";

type CatalogContextValue = {
  products: Product[];
  hydrated: boolean;
  store: AdminStoreState;
  getById: (id: string) => Product | undefined;
  getBySlug: (slug: string) => Product | undefined;
  getCategoryOverride: (slug: string) => CategoryOverride | undefined;
  refresh: () => void;
};

const CatalogContext = getSingletonContext<CatalogContextValue | null>(
  "__VELORA_CATALOG_CONTEXT__",
  null,
);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<AdminStoreState>(EMPTY_ADMIN_STORE);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    setStore(loadAdminStore());
  }, []);

  useEffect(() => {
    refresh();
    setHydrated(true);

    const onChange = () => refresh();
    window.addEventListener("storage", onChange);
    window.addEventListener(CATALOG_CHANGE_EVENT, onChange);

    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener(CATALOG_CHANGE_EVENT, onChange);
    };
  }, [refresh]);

  const products = useMemo(
    () => mergeCatalog(sourceProducts, store),
    [store],
  );

  const value = useMemo<CatalogContextValue>(
    () => ({
      products,
      hydrated,
      store,
      getById: (id: string) => getMergedProductById(id, store, sourceProducts),
      getBySlug: (slug: string) =>
        getMergedProductBySlug(slug, store, sourceProducts),
      getCategoryOverride: (slug: string) => readCategoryOverride(slug, store),
      refresh,
    }),
    [hydrated, products, refresh, store],
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
