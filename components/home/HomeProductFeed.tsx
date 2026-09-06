"use client";

import { ErrorState } from "@/components/ui/ErrorState";
import { FeaturedCollection } from "@/components/home/FeaturedCollection";
import { HomeProductRail } from "@/components/home/HomeProductRail";
import { Reveal } from "@/components/home/Reveal";
import { useCatalog } from "@/context/CatalogContext";
import { pickDiverse } from "@/lib/catalog";

const featuredIds = [
  "velvet-oud-edp",
  "woody-amber-edp",
  "rose-saffron-elixir",
] as const;

function isPerfume(product: { category: string; categorySlug?: string }) {
  return product.category === "Parfüm" || product.categorySlug === "parfum";
}

export function HomeProductFeed() {
  const { products, getById, hydrated, error, refresh } = useCatalog();

  if (!hydrated) {
    return (
      <section className="bg-ivory px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-12 tracking-label text-taupe">Yükleniyor</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-ivory px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <ErrorState
            message={error}
            onRetry={() => refresh()}
          />
        </div>
      </section>
    );
  }

  const popular = products.filter((product) => product.isPopular).slice(0, 16);
  const arrivals = pickDiverse(
    products.filter((product) => product.isNew),
    16,
  );
  const perfumes = products.filter(isPerfume);
  const featured = featuredIds
    .map((id) => getById(id))
    .filter((product): product is NonNullable<typeof product> =>
      Boolean(product && isPerfume(product)),
    );
  const featuredProducts =
    featured.length > 0 ? featured : pickDiverse(perfumes, 3);

  return (
    <>
      <HomeProductRail
        eyebrow="Koleksiyon"
        title="Çok Satanlar"
        products={popular}
        viewAllHref="/cok-satanlar"
      />
      <HomeProductRail
        eyebrow="Yeni"
        title="Yeni Gelenler"
        products={arrivals}
        viewAllHref="/yeni-gelenler"
        tone="muted"
      />
      {featuredProducts.length > 0 ? (
        <Reveal>
          <FeaturedCollection products={featuredProducts} />
        </Reveal>
      ) : null}
    </>
  );
}
