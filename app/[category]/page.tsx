import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CategoryPage } from "@/components/category/CategoryPage";
import { products } from "@/data/products";
import { CATEGORY_SLUGS, getCategoryPage } from "@/lib/category-pages";
import { BRAND_NAME } from "@/lib/constants";

export const dynamicParams = false;

export function generateStaticParams() {
  return CATEGORY_SLUGS.map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const config = getCategoryPage(category);

  if (!config) {
    return { title: BRAND_NAME };
  }

  return {
    title: config.title,
    description: config.description,
  };
}

export default async function CategoryRoute({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const config = getCategoryPage(category);

  if (!config) {
    notFound();
  }

  const catalog = products.filter(config.match);

  return (
    <CategoryPage
      key={config.slug}
      title={config.title}
      description={config.description}
      breadcrumbs={config.breadcrumbs}
      products={catalog}
      showPerfumeFilters={config.showPerfumeFilters}
      showClothingSizes={config.showClothingSizes}
    />
  );
}
