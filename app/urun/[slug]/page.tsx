import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/category/Breadcrumbs";
import { ProductDetail } from "@/components/product/ProductDetail";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { getProductBySlug, products } from "@/data/products";
import { getCategoryHref } from "@/lib/category-pages";
import { BRAND_NAME } from "@/lib/constants";
import { getRelatedProducts } from "@/lib/product-detail";

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
    return { title: `Ürün bulunamadı · ${BRAND_NAME}` };
  }

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const categoryHref = getCategoryHref(product.category);
  const related = getRelatedProducts(product, products, 4);

  return (
    <section className="bg-ivory px-6 py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <Breadcrumbs
          items={[
            { label: "Anasayfa", href: "/" },
            { label: product.category, href: categoryHref },
            { label: product.name, href: `/urun/${product.slug}` },
          ]}
        />
        <ProductDetail product={product} categoryHref={categoryHref} />
        <RelatedProducts products={related} />
      </div>
    </section>
  );
}
