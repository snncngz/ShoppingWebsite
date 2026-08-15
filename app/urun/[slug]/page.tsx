import type { Metadata } from "next";

import { ProductView } from "@/components/product/ProductView";
import { getProductBySlug, products } from "@/data/products";
import { BRAND_NAME } from "@/lib/constants";

export const dynamicParams = true;

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return { title: `Ürün · ${BRAND_NAME}` };
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: `${product.name} · ${BRAND_NAME}`,
      description: product.description,
      type: "website",
      locale: "tr_TR",
      images: product.images[0]
        ? [{ url: product.images[0], alt: product.name }]
        : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug) ?? null;

  return <ProductView slug={slug} fallback={product} />;
}
