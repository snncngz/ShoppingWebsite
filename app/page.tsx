import { BrandStory } from "@/components/home/BrandStory";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { EditorialBanner } from "@/components/home/EditorialBanner";
import { FeaturedCollection } from "@/components/home/FeaturedCollection";
import { Hero } from "@/components/home/Hero";
import { Newsletter } from "@/components/home/Newsletter";
import { ProductSection } from "@/components/home/ProductSection";
import { getProductById, products } from "@/data/products";
import type { Product } from "@/types";

function pickDiverse(items: Product[], count: number): Product[] {
  const byCategory = new Map<string, Product[]>();

  for (const item of items) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  const picked: Product[] = [];
  const categories = [...byCategory.keys()];
  let round = 0;

  while (picked.length < count) {
    let added = false;

    for (const category of categories) {
      const next = byCategory.get(category)?.[round];
      if (next) {
        picked.push(next);
        added = true;
        if (picked.length === count) {
          return picked;
        }
      }
    }

    if (!added) {
      break;
    }

    round += 1;
  }

  return picked;
}

const featuredIds = [
  "soft-grain-leather-tote",
  "velvet-oud-edp",
  "metal-minimalist-bracelet",
] as const;

export default function Home() {
  const popular = pickDiverse(
    products.filter((product) => product.isPopular),
    4,
  );
  const arrivals = pickDiverse(
    products.filter((product) => product.isNew),
    6,
  );
  const featured = featuredIds
    .map((id) => getProductById(id))
    .filter((product): product is Product => Boolean(product));

  return (
    <main className="bg-ivory">
      <Hero />
      <CategoryGrid />
      <ProductSection
        title="Çok Satanlar"
        products={popular}
        viewAllHref="/cok-satanlar"
        viewAllLabel="Tüm Çok Satanları Gör →"
        variant="standard"
      />
      <ProductSection
        title="Yeni Gelenler"
        products={arrivals}
        viewAllHref="/yeni-gelenler"
        viewAllLabel="Tüm Yeni Gelenleri Gör →"
        variant="editorial"
      />
      <EditorialBanner />
      <FeaturedCollection products={featured} />
      <BrandStory />
      <Newsletter />
    </main>
  );
}
