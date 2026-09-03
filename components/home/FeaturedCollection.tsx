import Link from "next/link";

import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types";

type FeaturedCollectionProps = {
  products: Product[];
};

export function FeaturedCollection({ products }: FeaturedCollectionProps) {
  return (
    <section className="bg-ivory px-6 py-24 lg:px-8 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-12 lg:gap-16 lg:items-center">
        <div className="relative aspect-[4/5] overflow-hidden bg-off-white lg:col-span-7 lg:aspect-[3/4]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/placeholders/parfum.svg"
            alt="Lucien Perrin parfüm koleksiyonu"
            className="h-full w-full object-cover object-[center_30%] lg:scale-110"
          />
        </div>

        <div className="lg:col-span-5">
          <p className="text-12 tracking-label text-taupe">Collection</p>
          <h2 className="mt-3 font-heading text-32 text-black lg:text-48">
            The Essential Collection
          </h2>
          <p className="mt-6 text-16 text-charcoal">
            Günün omurgasını kuran parçalar — yumuşak jersey, net bir paça ve
            cilde yakın bir imza koku.
          </p>
          <Link
            href="/yeni-gelenler"
            className="mt-8 inline-flex h-12 items-center justify-center bg-charcoal px-8 text-12 tracking-nav text-ivory transition-colors hover:bg-black"
          >
            Koleksiyonu Keşfet
          </Link>

          <ul className="mt-12 flex flex-col gap-6">
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} variant="compact" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
