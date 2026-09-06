"use client";

import { useRef } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types";

type HomeBestsellersRailProps = {
  products: Product[];
};

export function HomeBestsellersRail({ products }: HomeBestsellersRailProps) {
  const scroller = useRef<HTMLDivElement>(null);

  if (products.length === 0) {
    return null;
  }

  const scrollByCard = (direction: -1 | 1) => {
    const node = scroller.current;
    if (!node) {
      return;
    }
    const card = node.querySelector("article");
    const amount = (card?.clientWidth ?? 260) + 16;
    node.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  return (
    <section className="bg-ivory px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-12 font-semibold tracking-label text-taupe">Koleksiyon</p>
            <h2 className="mt-2 font-heading text-32 font-bold text-black lg:text-48">
              Çok Satanlar
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/cok-satanlar"
              className="hidden text-14 font-semibold tracking-nav text-charcoal hover:text-black sm:inline"
            >
              Tümünü gör
            </Link>
            <button
              type="button"
              aria-label="Sola kaydır"
              onClick={() => scrollByCard(-1)}
              className="hidden h-11 w-11 items-center justify-center border border-border text-charcoal hover:bg-off-white sm:inline-flex"
            >
              <ChevronLeft size={18} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              aria-label="Sağa kaydır"
              onClick={() => scrollByCard(1)}
              className="hidden h-11 w-11 items-center justify-center border border-border text-charcoal hover:bg-off-white sm:inline-flex"
            >
              <ChevronRight size={18} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        <div
          ref={scroller}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4"
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="w-[46vw] shrink-0 snap-start sm:w-56 lg:w-64"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <Link
          href="/cok-satanlar"
          className="mt-5 inline-flex text-14 font-semibold tracking-nav text-charcoal sm:hidden"
        >
          Tümünü gör
        </Link>
      </div>
    </section>
  );
}
