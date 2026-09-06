"use client";

import { useEffect, useState } from "react";

import { Breadcrumbs } from "@/components/category/Breadcrumbs";
import { EmptyState } from "@/components/category/EmptyState";
import { ProductDetail } from "@/components/product/ProductDetail";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { ErrorState } from "@/components/ui/ErrorState";
import { ProductDetailSkeleton } from "@/components/ui/Skeleton";
import { useCatalog } from "@/context/CatalogContext";
import { getAdminErrorMessage } from "@/lib/adminApi";
import { getCategoryHref } from "@/lib/category-pages";
import {
  fetchStorefrontProductBySlug,
  fetchStorefrontProductPage,
} from "@/lib/storefrontApi";
import type { Product } from "@/types";

type ProductViewProps = {
  slug: string;
};

export function ProductView({ slug }: ProductViewProps) {
  const { getBySlug, categoryHref, hydrated } = useCatalog();
  const catalogProduct = getBySlug(slug);
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">(
    "loading",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError("");
    setProduct(null);
    setRelated([]);

    void fetchStorefrontProductBySlug(slug)
      .then(async (found) => {
        if (cancelled) {
          return;
        }
        if (!found) {
          setStatus("missing");
          return;
        }

        setProduct(found.product);
        setStatus("ready");

        try {
          const relatedPage = await fetchStorefrontProductPage({
            category: found.categorySlug,
            limit: 8,
            sort: "newest",
          });
          if (cancelled) {
            return;
          }
          setRelated(
            relatedPage.items
              .filter((item) => item.id !== found.product.id)
              .slice(0, 4),
          );
        } catch {
          if (!cancelled) {
            setRelated([]);
          }
        }
      })
      .catch((caught) => {
        if (cancelled) {
          return;
        }
        setError(getAdminErrorMessage(caught));
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const shown = product ?? catalogProduct;

  if (!shown && status === "loading") {
    return (
      <section className="bg-ivory px-6 py-12 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <ProductDetailSkeleton />
        </div>
      </section>
    );
  }

  if (!shown && status === "error") {
    return (
      <section className="bg-ivory px-6 py-12 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <ErrorState message={error} />
        </div>
      </section>
    );
  }

  if (!shown && (status === "missing" || (hydrated && !catalogProduct))) {
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

  if (!shown) {
    return (
      <section className="bg-ivory px-6 py-12 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <ProductDetailSkeleton />
        </div>
      </section>
    );
  }

  const categoryLink =
    categoryHref(shown.category) === "/"
      ? getCategoryHref(shown.category)
      : categoryHref(shown.category);

  return (
    <section className="bg-ivory px-6 py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <Breadcrumbs
          items={[
            { label: "Anasayfa", href: "/" },
            { label: shown.category, href: categoryLink },
            { label: shown.name, href: `/urun/${shown.slug}` },
          ]}
        />
        <ProductDetail product={shown} categoryHref={categoryLink} />
        <RelatedProducts products={related} />
      </div>
    </section>
  );
}
