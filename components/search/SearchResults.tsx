"use client";

import { EmptyState } from "@/components/category/EmptyState";
import { ProductCard } from "@/components/product/ProductCard";
import { useCatalog } from "@/context/CatalogContext";
import type { Product } from "@/types";

type SearchResultsProps = {
  products: Product[];
  variant?: "compact" | "default";
  onResultClick?: (product: Product) => void;
};

export function SearchResults({
  products,
  variant = "compact",
  onResultClick,
}: SearchResultsProps) {
  const { products: catalog } = useCatalog();

  if (products.length === 0) {
    if (variant === "default") {
      const popular = catalog.filter((product) => product.isPopular).slice(0, 4);

      return (
        <div>
          <EmptyState
            title="Sonuç bulunamadı"
            message="Farklı bir kelime, kategori veya alt kategori deneyin."
            actionHref="/"
            actionLabel="Alışverişe Devam Et"
          />
          {popular.length > 0 ? (
            <div className="mt-16">
              <p className="text-12 tracking-label text-taupe">Popüler Ürünler</p>
              <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 lg:gap-8">
                {popular.map((product) => (
                  <li key={product.id}>
                    <ProductCard product={product} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div className="py-16 text-center">
        <p className="text-12 tracking-label text-taupe">Sonuç Bulunamadı</p>
        <p className="mt-3 font-heading text-24 text-black">
          Aramanızla eşleşen ürün yok.
        </p>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <ul className="flex flex-col gap-6">
        {products.map((product) => (
          <li key={product.id} onClick={() => onResultClick?.(product)}>
            <ProductCard product={product} variant="compact" />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 lg:gap-8">
      {products.map((product) => (
        <li key={product.id} onClick={() => onResultClick?.(product)}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
