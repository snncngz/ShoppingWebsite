import type { Metadata } from "next";

import { CategoryPage } from "@/components/category/CategoryPage";
import { getCategoryPage } from "@/lib/category-pages";
import { BRAND_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; sub: string }>;
}): Promise<Metadata> {
  const { category, sub } = await params;
  const parent = getCategoryPage(category);
  const label = sub.replace(/-/g, " ");

  return {
    title: parent ? `${label} · ${parent.title}` : label,
    description: parent?.description,
    openGraph: {
      title: `${label} · ${BRAND_NAME}`,
      type: "website",
      locale: "tr_TR",
    },
  };
}

export default async function SubcategoryRoute({
  params,
}: {
  params: Promise<{ category: string; sub: string }>;
}) {
  const { category, sub } = await params;
  const parent = getCategoryPage(category);

  return (
    <CategoryPage
      key={`${category}-${sub}`}
      slug={sub}
      title={sub}
      description={parent?.description ?? ""}
      breadcrumbs={
        parent?.breadcrumbs.concat({
          label: sub,
          href: `/${category}/${sub}`,
        }) ?? [
          { label: "Anasayfa", href: "/" },
          { label: category, href: `/${category}` },
          { label: sub, href: `/${category}/${sub}` },
        ]
      }
      showPerfumeFilters={parent?.showPerfumeFilters ?? false}
      showClothingSizes={parent?.showClothingSizes ?? false}
    />
  );
}
