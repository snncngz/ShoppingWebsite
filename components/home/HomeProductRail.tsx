"use client";

import { useEffect, useRef, type PointerEvent } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types";

type HomeProductRailProps = {
  products: Product[];
  title: string;
  eyebrow: string;
  viewAllHref: string;
  viewAllLabel?: string;
  tone?: "ivory" | "muted";
};

export function HomeProductRail({
  products,
  title,
  eyebrow,
  viewAllHref,
  viewAllLabel = "Tümünü gör",
  tone = "ivory",
}: HomeProductRailProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startScroll: number;
    active: boolean;
  } | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    const node = scroller.current;
    if (!node) {
      return;
    }

    const onClickCapture = (event: MouseEvent) => {
      if (!suppressClick.current) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      suppressClick.current = false;
    };

    node.addEventListener("click", onClickCapture, true);
    return () => node.removeEventListener("click", onClickCapture, true);
  }, []);

  if (products.length === 0) {
    return null;
  }

  const scrollByCard = (direction: -1 | 1) => {
    const node = scroller.current;
    if (!node) {
      return;
    }
    const card = node.querySelector("[data-rail-card]");
    const amount = (card instanceof HTMLElement ? card.offsetWidth : 260) + 16;
    node.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || event.button !== 0) {
      return;
    }
    if (event.target instanceof Element && event.target.closest("button")) {
      return;
    }
    const node = scroller.current;
    if (!node) {
      return;
    }
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: node.scrollLeft,
      active: false,
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    const node = scroller.current;
    if (!state || !node || event.pointerId !== state.pointerId) {
      return;
    }

    const delta = event.clientX - state.startX;
    if (!state.active) {
      if (Math.abs(delta) < 10) {
        return;
      }
      state.active = true;
      suppressClick.current = true;
      node.setPointerCapture(event.pointerId);
      node.dataset.dragging = "true";
    }

    node.scrollLeft = state.startScroll - delta;
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    const node = scroller.current;
    if (!state || event.pointerId !== state.pointerId) {
      return;
    }
    if (state.active && node?.hasPointerCapture(event.pointerId)) {
      node.releasePointerCapture(event.pointerId);
    }
    if (node) {
      delete node.dataset.dragging;
    }
    drag.current = null;
  };

  return (
    <section
      className={
        tone === "muted"
          ? "bg-off-white px-0 py-10 sm:py-14 lg:py-16"
          : "bg-ivory px-0 py-10 sm:py-14 lg:py-16"
      }
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-12 font-semibold tracking-label text-taupe">{eyebrow}</p>
            <h2 className="mt-2 font-heading text-32 font-bold text-black lg:text-48">
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={viewAllHref}
              className="hidden text-14 font-semibold tracking-nav text-charcoal hover:text-black sm:inline"
            >
              {viewAllLabel}
            </Link>
            <button
              type="button"
              aria-label="Sola kaydır"
              onClick={() => scrollByCard(-1)}
              className="hidden h-11 w-11 items-center justify-center border border-border text-charcoal hover:bg-ivory sm:inline-flex"
            >
              <ChevronLeft size={18} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              aria-label="Sağa kaydır"
              onClick={() => scrollByCard(1)}
              className="hidden h-11 w-11 items-center justify-center border border-border text-charcoal hover:bg-ivory sm:inline-flex"
            >
              <ChevronRight size={18} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scroller}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDragStart={(event) => event.preventDefault()}
        className="flex cursor-grab snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:hidden data-[dragging=true]:cursor-grabbing data-[dragging=true]:snap-none sm:gap-4 sm:px-6 lg:px-[max(2rem,calc((100vw-80rem)/2+2rem))]"
      >
        {products.map((product) => (
          <div
            key={product.id}
            data-rail-card
            className="w-[42vw] shrink-0 snap-start select-none sm:w-56 lg:w-64"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      <div className="mx-auto mt-5 max-w-7xl px-4 sm:hidden">
        <Link
          href={viewAllHref}
          className="inline-flex text-14 font-semibold tracking-nav text-charcoal"
        >
          {viewAllLabel}
        </Link>
      </div>
    </section>
  );
}
