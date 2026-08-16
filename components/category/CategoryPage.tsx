"use client";

import { useEffect, useMemo, useState } from "react";

import { SlidersHorizontal } from "lucide-react";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/category/Breadcrumbs";
import { EmptyState } from "@/components/category/EmptyState";
import { FilterChips } from "@/components/category/FilterChips";
import { FilterDrawer } from "@/components/category/FilterDrawer";
import { FilterPanel } from "@/components/category/FilterPanel";
import { SortSelect } from "@/components/category/SortSelect";
import { ProductCard } from "@/components/product/ProductCard";
import { CategorySkeleton } from "@/components/ui/Skeleton";
import { useCatalog } from "@/context/CatalogContext";
import { getCategoryPage, type BreadcrumbItem } from "@/lib/category-pages";
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
  products: Product[];
  showPerfumeFilters: boolean;
  showClothingSizes: boolean;
};

export function CategoryPage({
  slug,
  title,
  description,
  breadcrumbs,
  products: initialProducts,
  showPerfumeFilters,
  showClothingSizes,
}: CategoryPageProps) {
  const { products: catalog, hydrated, getResolvedCategory } = useCatalog();
  const staticConfig = getCategoryPage(slug);
  const resolved = getResolvedCategory(slug);
  const products =
    hydrated && resolved ? catalog.filter(resolved.match) : initialProducts;
  const heading = resolved?.title ?? title;
  const copy = resolved?.description ?? description;
  const crumbs = resolved?.breadcrumbs ?? breadcrumbs;
  const perfumeFilters = resolved?.showPerfumeFilters ?? showPerfumeFilters;
  const clothingSizes = resolved?.showClothingSizes ?? showClothingSizes;
  const [filters, setFilters] = useState(createEmptyFilters);
  const [sort, setSort] = useState<SortValue>("recommended");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (media.matches) {
        setDrawerOpen(false);
      }
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const options = useMemo(
    () =>
      getFilterOptions(products, {
        showClothingSizes: clothingSizes,
        showPerfumeFilters: perfumeFilters,
      }),
    [products, clothingSizes, perfumeFilters],
  );

  const visibleProducts = useMemo(() => {
    return sortProducts(filterProducts(products, filters), sort, products);
  }, [products, filters, sort]);

  const catalogIsEmpty = products.length === 0;
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

  if (!hydrated && !staticConfig) {
    return <CategorySkeleton />;
  }

  if (hydrated && (!resolved || resolved.hidden)) {
    notFound();
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
              <p className="text-14 text-taupe">{visibleProducts.length} ürün</p>
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
                    message="Koleksiyon yakında VELORA dilinde tamamlanacak."
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
