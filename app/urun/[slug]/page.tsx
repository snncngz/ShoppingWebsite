import type { Metadata } from "next";

import { ProductView } from "@/components/product/ProductView";
import { BRAND_NAME } from "@/lib/constants";
import { fetchStorefrontProductBySlug } from "@/lib/storefrontApi";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const found = await fetchStorefrontProductBySlug(slug);
    if (!found) {
      return { title: `Ürün · ${BRAND_NAME}` };
    }

    const product = found.product;
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
  } catch {
    return { title: `Ürün · ${BRAND_NAME}` };
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ProductView slug={slug} />;
}
