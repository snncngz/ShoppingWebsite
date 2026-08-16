"use client";

import { EmptyState } from "@/components/category/EmptyState";
import { ProductCard } from "@/components/product/ProductCard";
import { ErrorState } from "@/components/ui/ErrorState";
import type { Product } from "@/types";

type SearchResultsProps = {
  products: Product[];
  loading?: boolean;
  error?: string;
  variant?: "compact" | "default";
  onResultClick?: (product: Product) => void;
};

export function SearchResults({
  products,
  loading = false,
  error = "",
  variant = "compact",
  onResultClick,
}: SearchResultsProps) {
  if (loading) {
    return (
      <p className="py-16 text-center text-12 tracking-label text-taupe">
        Yükleniyor
      </p>
    );
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (products.length === 0) {
    if (variant === "default") {
      return (
        <EmptyState
          title="Sonuç bulunamadı"
          message="Farklı bir kelime deneyin."
          actionHref="/"
          actionLabel="Alışverişe Devam Et"
        />
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
