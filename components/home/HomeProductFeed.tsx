"use client";

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
  const { products, getById } = useCatalog();
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
        <FeaturedCollection products={featured} />
      </Reveal>
    </>
  );
}
