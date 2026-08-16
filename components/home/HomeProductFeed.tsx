"use client";

import { ErrorState } from "@/components/ui/ErrorState";
import { FeaturedCollection } from "@/components/home/FeaturedCollection";
import { ProductSection } from "@/components/home/ProductSection";
import { Reveal } from "@/components/home/Reveal";
import { useCatalog } from "@/context/CatalogContext";
import { pickDiverse } from "@/lib/catalog";

const featuredIds = [
  "soft-grain-leather-tote",
  "velvet-oud-edp",
  "metal-minimalist-bracelet",
] as const;

export function HomeProductFeed() {
  const { products, getById, hydrated, error, refresh } = useCatalog();

  if (!hydrated) {
    return (
      <section className="bg-ivory px-6 py-24 lg:px-8 lg:py-32">
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

  const popular = pickDiverse(
    products.filter((product) => product.isPopular),
    4,
  );
  const arrivals = pickDiverse(
    products.filter((product) => product.isNew),
    6,
  );
  const featured = featuredIds
    .map((id) => getById(id))
    .filter((product): product is NonNullable<typeof product> => Boolean(product));
  const featuredProducts =
    featured.length > 0 ? featured : pickDiverse(products, 3);

  return (
    <>
      <Reveal>
        <ProductSection
          title="Çok Satanlar"
          products={popular}
          viewAllHref="/cok-satanlar"
          viewAllLabel="Tüm Çok Satanları Gör →"
          variant="standard"
        />
      </Reveal>
      <Reveal>
        <ProductSection
          title="Yeni Gelenler"
          products={arrivals}
          viewAllHref="/yeni-gelenler"
          viewAllLabel="Tüm Yeni Gelenleri Gör →"
          variant="editorial"
        />
      </Reveal>
      <Reveal>
        <FeaturedCollection products={featuredProducts} />
      </Reveal>
    </>
  );
}
