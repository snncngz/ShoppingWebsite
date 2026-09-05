import Link from "next/link";

import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types";

type ProductSectionProps = {
  title: string;
  products: Product[];
  viewAllHref: string;
  viewAllLabel: string;
  variant?: "standard" | "editorial";
};

export function ProductSection({
  title,
  products,
  viewAllHref,
  viewAllLabel,
  variant = "standard",
}: ProductSectionProps) {
  const isEditorial = variant === "editorial";

  return (
    <section
      className={
        isEditorial
          ? "bg-off-white px-6 py-24 lg:px-8 lg:py-32"
          : "bg-ivory px-6 py-24 lg:px-8 lg:py-32"
      }
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-12 tracking-label text-taupe">
              {isEditorial ? "Yeni" : "Çok Satanlar"}
            </p>
            <h2 className="mt-3 font-heading text-32 text-black lg:text-48">
              {title}
            </h2>
          </div>
          <Link
            href={viewAllHref}
            className="text-12 tracking-nav text-charcoal transition-colors hover:text-black"
          >
            {viewAllLabel}
          </Link>
        </div>

        <ul
          className={
            isEditorial
              ? "mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-12"
              : "mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-8"
          }
        >
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard
                product={product}
                variant={isEditorial ? "editorial" : "default"}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
