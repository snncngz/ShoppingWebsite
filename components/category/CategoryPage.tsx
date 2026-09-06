"use client";

import { useMemo, useState } from "react";

import { SlidersHorizontal } from "lucide-react";

import { Breadcrumbs } from "@/components/category/Breadcrumbs";
import { EmptyState } from "@/components/category/EmptyState";
import { FilterChips } from "@/components/category/FilterChips";
import { FilterDrawer } from "@/components/category/FilterDrawer";
import { FilterPanel } from "@/components/category/FilterPanel";
import { SortSelect } from "@/components/category/SortSelect";
import { ProductCard } from "@/components/product/ProductCard";
import { CategorySkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { useCatalog } from "@/context/CatalogContext";
import {
  getCategoryPage,
  getPerfumeGender,
  perfumeGenderFromSlug,
  type BreadcrumbItem,
} from "@/lib/category-pages";
import {
  createEmptyFilters,
  filterProducts,
  getFilterOptions,
  sortProducts,
  type SortValue,
} from "@/lib/filters";
import type { Product } from "@/types";

export type CategoryPageProps = {
  slug: string;
  title: string;
  description: string;
  breadcrumbs: BreadcrumbItem[];
  showPerfumeFilters: boolean;
  showClothingSizes: boolean;
};

function leafSlug(slug: string): string {
  return slug.split("/").filter(Boolean).pop() ?? slug;
}

function matchesCategory(
  product: Product,
  slug: string,
  resolvedMatch?: (item: Product) => boolean,
): boolean {
  if (resolvedMatch) {
    if (!resolvedMatch(product)) {
      return false;
    }
    const gender = perfumeGenderFromSlug(slug);
    if (gender && slug.includes("/")) {
      return getPerfumeGender(product) === gender;
    }
    return true;
  }

  const parts = slug.split("/").filter(Boolean);
  const leaf = parts[parts.length - 1] ?? slug;
  const root = parts[0] ?? leaf;
  const config = getCategoryPage(root) ?? getCategoryPage(leaf);
  if (config) {
    if (!config.match(product)) {
      return false;
    }
    const gender = perfumeGenderFromSlug(leaf);
    if (gender && parts.length > 1) {
      return getPerfumeGender(product) === gender;
    }
    return true;
  }

  return (
    product.categorySlug === leaf ||
    product.categoryLeafSlug === leaf ||
    product.subcategory.toLocaleLowerCase("tr-TR") === leaf.toLocaleLowerCase("tr-TR")
  );
}

export function CategoryPage({
  slug,
  title,
  description,
  breadcrumbs,
  showPerfumeFilters,
  showClothingSizes,
}: CategoryPageProps) {
  const {
    products,
    hydrated,
    getResolvedCategory,
    error: catalogError,
    refresh,
  } = useCatalog();
  const resolved =
    getResolvedCategory(slug) ?? getResolvedCategory(leafSlug(slug));
  const heading = resolved?.title ?? title;
  const copy = resolved?.description ?? description;
  const crumbs = resolved?.breadcrumbs ?? breadcrumbs;
  const perfumeFilters = resolved?.showPerfumeFilters ?? showPerfumeFilters;
  const clothingSizes = resolved?.showClothingSizes ?? showClothingSizes;
  const [filters, setFilters] = useState(createEmptyFilters);
  const [sort, setSort] = useState<SortValue>("recommended");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const scopedProducts = useMemo(
    () =>
      products.filter((product) =>
        matchesCategory(product, slug, resolved?.match),
      ),
    [products, resolved, slug],
  );

  const options = useMemo(
    () =>
      getFilterOptions(scopedProducts, {
        showClothingSizes: clothingSizes,
        showPerfumeFilters: perfumeFilters,
      }),
    [scopedProducts, clothingSizes, perfumeFilters],
  );

  const visibleProducts = useMemo(
    () => sortProducts(filterProducts(scopedProducts, filters), sort, scopedProducts),
    [scopedProducts, filters, sort],
  );

  const catalogIsEmpty = scopedProducts.length === 0;
  const noFilterResults = !catalogIsEmpty && visibleProducts.length === 0;
  const showSizeFilter = !perfumeFilters;

  const clearFilters = () => {
    setFilters(createEmptyFilters());
  };

  const filterPanel = (
    <FilterPanel
      options={options}
      value={filters}
      onChange={setFilters}
      onClear={clearFilters}
      showPerfumeFilters={perfumeFilters}
      showSizeFilter={showSizeFilter}
    />
  );

  if (!hydrated) {
    return <CategorySkeleton />;
  }

  if (catalogError && products.length === 0) {
    return (
      <section className="bg-ivory px-6 py-12 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <ErrorState message={catalogError} onRetry={() => refresh()} />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-ivory px-6 py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <Breadcrumbs items={crumbs} />

        <header className="mt-8 max-w-2xl">
          <h1 className="font-heading text-32 text-black lg:text-48">{heading}</h1>
          <p className="mt-4 text-16 text-charcoal">{copy}</p>
        </header>

        <div className="mt-8 flex items-center justify-between gap-4 border-y border-border py-4">
          <p className="text-14 text-taupe">{`${visibleProducts.length} ürün`}</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-12 items-center gap-2 border border-border px-4 text-12 tracking-nav text-charcoal lg:hidden"
              onClick={() => setDrawerOpen(true)}
            >
              <SlidersHorizontal size={14} strokeWidth={1.4} />
              Filtrele
            </button>
            <SortSelect value={sort} onChange={setSort} />
          </div>
        </div>

        <FilterChips filters={filters} onChange={setFilters} onClear={clearFilters} />

        <div className="mt-8 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12">
          <aside className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
              <p className="text-12 tracking-label text-black">Filtrele</p>
              {filterPanel}
            </div>
          </aside>

          <div>
            {catalogIsEmpty ? (
              <EmptyState
                title="Bu kategoride henüz ürün bulunmuyor"
                message="Koleksiyon yakında Lucien Perrin dilinde tamamlanacak."
              />
            ) : noFilterResults ? (
              <EmptyState
                title="Sonuç bulunamadı"
                message="Seçtiğiniz filtrelere uygun ürün yok. Filtreleri temizleyerek yeniden deneyin."
                actionLabel="Filtreleri Temizle"
                onAction={clearFilters}
              />
            ) : (
              <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 lg:gap-8">
                {visibleProducts.map((product) => (
                  <li key={product.id}>
                    <ProductCard product={product} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <FilterDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {filterPanel}
      </FilterDrawer>
    </section>
  );
}
