import type { Metadata } from "next";

import { CategoryPage } from "@/components/category/CategoryPage";
import { ProductView } from "@/components/product/ProductView";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { VerifyEmailView } from "@/components/auth/VerifyEmailView";
import { getCategoryPage } from "@/lib/category-pages";
import { BRAND_NAME } from "@/lib/constants";
import { Suspense } from "react";

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

  if (category === "urun") {
    return <ProductView slug={sub} />;
  }

  if (category === "sifre-yenile") {
    return (
      <Suspense fallback={null}>
        <ResetPasswordForm token={sub} />
      </Suspense>
    );
  }

  if (category === "dogrula") {
    return (
      <Suspense fallback={null}>
        <VerifyEmailView token={sub} />
      </Suspense>
    );
  }

  const parent = getCategoryPage(category);

  return (
    <CategoryPage
      key={`${category}-${sub}`}
      slug={`${category}/${sub}`}
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
