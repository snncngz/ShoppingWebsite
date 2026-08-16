import type { Metadata } from "next";

import { CategoryPage } from "@/components/category/CategoryPage";
import { CATEGORY_SLUGS, getCategoryPage } from "@/lib/category-pages";
import { BRAND_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

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
    openGraph: {
      title: `${config.title} · ${BRAND_NAME}`,
      description: config.description,
      type: "website",
      locale: "tr_TR",
    },
  };
}

export default async function CategoryRoute({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const config = getCategoryPage(category);

  return (
    <CategoryPage
      key={category}
      slug={category}
      title={config?.title ?? ""}
      description={config?.description ?? ""}
      breadcrumbs={
        config?.breadcrumbs ?? [
          { label: "Anasayfa", href: "/" },
          { label: category, href: `/${category}` },
        ]
      }
      showPerfumeFilters={config?.showPerfumeFilters ?? false}
      showClothingSizes={config?.showClothingSizes ?? false}
    />
  );
}
