"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart } from "lucide-react";
import Link from "next/link";

import { QuickAddModal } from "@/components/product/QuickAddModal";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatPrice } from "@/lib/utils";
import { getDefaultCartVariant, getVariantConfig } from "@/lib/variants";
import type { Product } from "@/types";

type ProductCardProps = {
  product: Product;
  variant?: "default" | "editorial" | "compact";
};

const aspectClass = {
  default: "aspect-[4/5]",
  editorial: "aspect-[3/4]",
} as const;

export function ProductCard({ product, variant = "default" }: ProductCardProps) {
  const { addItem } = useCart();
  const { hasItem, toggleItem } = useWishlist();
  const wished = hasItem(product.id);
  const [quickOpen, setQuickOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<number | null>(null);
  const primary = product.images[0];
  const secondary = product.images[1] ?? product.images[0];
  const href = `/urun/${product.slug}`;

  useEffect(() => {
    return () => {
      if (addedTimer.current) {
        window.clearTimeout(addedTimer.current);
      }
    };
  }, []);

  const showAdded = () => {
    setAdded(true);
    if (addedTimer.current) {
      window.clearTimeout(addedTimer.current);
    }
    addedTimer.current = window.setTimeout(() => setAdded(false), 1600);
  };

  const handleQuickAdd = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const config = getVariantConfig(product);

    if (config.requiresModal) {
      setQuickOpen(true);
      return;
    }

    const defaults = getDefaultCartVariant(product);
    addItem({
      productId: product.id,
      color: defaults.color,
      size: defaults.size,
      quantity: 1,
    });
    showAdded();
  };

  if (variant === "compact") {
    return (
      <article className="group flex gap-4">
        <Link
          href={href}
          className="relative h-32 w-24 shrink-0 overflow-hidden bg-off-white"
          aria-label={product.name}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={primary}
            alt=""
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        <div className="min-w-0 pt-1">
          <p className="text-12 tracking-label text-taupe">{product.category}</p>
          <Link href={href}>
            <h3 className="mt-1 truncate font-heading text-18 text-black transition-colors group-hover:text-accent">
              {product.name}
            </h3>
          </Link>
          <p className="mt-2 text-14 text-charcoal">{formatPrice(product.price)}</p>
        </div>
      </article>
    );
  }

  return (
    <article className="group">
      <div className={`relative overflow-hidden bg-off-white ${aspectClass[variant]}`}>
        <Link href={href} className="absolute inset-0 block" aria-label={product.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={primary}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-0"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={secondary}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_18%] scale-105 opacity-0 transition-all duration-700 ease-out group-hover:scale-110 group-hover:opacity-100"
          />
        </Link>

        {product.badge ? (
          <span className="pointer-events-none absolute left-3 top-3 z-10 bg-ivory/90 px-2 py-1 text-12 tracking-label text-charcoal">
            {product.badge}
          </span>
        ) : null}

        <button
          type="button"
          aria-label={wished ? "Favorilerden çıkar" : "Favorilere ekle"}
          aria-pressed={wished}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleItem(product.id);
          }}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center bg-ivory/90 text-charcoal opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100"
        >
          <Heart
            size={16}
            strokeWidth={1.4}
            className={wished ? "fill-charcoal" : ""}
          />
        </button>

        <button
          type="button"
          onClick={handleQuickAdd}
          className="absolute inset-x-3 bottom-3 z-10 hidden h-12 bg-ivory text-12 tracking-nav text-black opacity-0 translate-y-2 transition-all duration-300 md:block md:group-hover:translate-y-0 md:group-hover:opacity-100"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={added ? "added" : "add"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="inline-flex items-center justify-center gap-2"
            >
              {added ? (
                <>
                  Eklendi
                  <Check size={14} strokeWidth={1.6} />
                </>
              ) : (
                "Hızlı Ekle"
              )}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>

      <div className="mt-4">
        <p className="text-12 tracking-label text-taupe">{product.category}</p>
        <Link href={href} className="mt-1 block">
          <h3 className="font-heading text-18 text-black transition-colors group-hover:text-accent lg:text-24">
            {product.name}
          </h3>
        </Link>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-14 text-charcoal">{formatPrice(product.price)}</span>
          {product.oldPrice ? (
            <span className="text-12 text-taupe line-through">
              {formatPrice(product.oldPrice)}
            </span>
          ) : null}
        </div>
      </div>

      <QuickAddModal
        product={product}
        isOpen={quickOpen}
        onClose={() => setQuickOpen(false)}
        onAdded={showAdded}
      />
    </article>
  );
}
