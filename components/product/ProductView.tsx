"use client";

import { Breadcrumbs } from "@/components/category/Breadcrumbs";
import { EmptyState } from "@/components/category/EmptyState";
import { ProductDetail } from "@/components/product/ProductDetail";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { ProductDetailSkeleton } from "@/components/ui/Skeleton";
import { useCatalog } from "@/context/CatalogContext";
import { getRelatedProducts } from "@/lib/product-detail";
import type { Product } from "@/types";

type ProductViewProps = {
  slug: string;
  fallback: Product | null;
};

export function ProductView({ slug, fallback }: ProductViewProps) {
  const { getBySlug, products, hydrated, categoryHref } = useCatalog();
  const product = hydrated ? (getBySlug(slug) ?? null) : fallback;

  if (!hydrated && !fallback) {
    return (
      <section className="bg-ivory px-6 py-12 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <ProductDetailSkeleton />
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="bg-ivory px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <EmptyState
            title="Ürün bulunamadı"
            message="Aradığınız parça koleksiyonda yer almıyor veya yayından kaldırıldı."
            actionHref="/"
            actionLabel="Anasayfaya Dön"
          />
        </div>
      </section>
    );
  }

  const categoryLink = categoryHref(product.category);
  const related = getRelatedProducts(product, products, 4);

  return (
    <section className="bg-ivory px-6 py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <Breadcrumbs
          items={[
            { label: "Anasayfa", href: "/" },
            { label: product.category, href: categoryLink },
            { label: product.name, href: `/urun/${product.slug}` },
          ]}
        />
        <ProductDetail product={product} categoryHref={categoryLink} />
        <RelatedProducts products={related} />
      </div>
    </section>
  );
}
