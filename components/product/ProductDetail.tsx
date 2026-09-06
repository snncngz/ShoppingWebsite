"use client";

import { useEffect, useRef, useState } from "react";

import { Check, Heart, Minus, Plus } from "lucide-react";
import Link from "next/link";

import { FragranceProfile } from "@/components/product/FragranceProfile";
import { ProductAccordion } from "@/components/product/ProductAccordion";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductPrice } from "@/components/product/ProductPrice";
import { ShareProductButton } from "@/components/product/ShareProductButton";
import { SizeGuideModal } from "@/components/product/SizeGuideModal";
import { StarRating } from "@/components/product/StarRating";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { catalogVolumes, displayPricing, toPricedProduct } from "@/lib/pricing";
import { getAccordionContent } from "@/lib/product-detail";
import type { Product } from "@/types";

type ProductDetailProps = {
  product: Product;
  categoryHref: string;
};

export function ProductDetail({ product, categoryHref }: ProductDetailProps) {
  const { addItem } = useCart();
  const { hasItem, toggleItem } = useWishlist();
  const isPerfume = Boolean(product.perfumeDetails);
  const optionValues = isPerfume
    ? catalogVolumes(product)
    : product.sizes;

  const [color, setColor] = useState(product.colors[0] ?? "");
  const [option, setOption] = useState(optionValues[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const addedTimer = useRef<number | null>(null);
  const favorited = hasItem(product.id);

  const accordionItems = getAccordionContent(product);
  const maxQuantity = Math.max(1, product.stock);
  const discountPercent = displayPricing(toPricedProduct(product), option)
    .discountPercent;

  useEffect(() => {
    return () => {
      if (addedTimer.current) {
        window.clearTimeout(addedTimer.current);
      }
    };
  }, []);

  const handleAddToBag = () => {
    addItem({
      productId: product.id,
      color,
      size: option,
      quantity,
    });
    setAdded(true);
    if (addedTimer.current) {
      window.clearTimeout(addedTimer.current);
    }
    addedTimer.current = window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <>
    <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-16">
      <ProductGallery
        images={product.images}
        name={product.name}
        discountPercent={discountPercent}
      />

      <div>
        <p className="text-12 tracking-label text-taupe">
          <Link href={categoryHref} className="transition-colors hover:text-black">
            {product.category}
          </Link>
          {product.subcategory ? ` · ${product.subcategory}` : ""}
        </p>
        <h1 className="mt-3 font-heading text-32 text-black lg:text-48">
          {product.name}
        </h1>

        <div className="mt-4">
          <StarRating rating={product.rating} reviewCount={product.reviewCount} />
        </div>

        <div className="mt-6">
          <ProductPrice product={product} variant={option} size="lg" />
        </div>

        {product.colors.length > 0 ? (
          <fieldset className="mt-8">
            <legend className="text-12 tracking-label text-black">Renk</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.colors.map((value) => {
                const selected = color === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setColor(value)}
                    aria-pressed={selected}
                    className={`h-12 px-4 text-12 tracking-nav ${
                      selected
                        ? "border border-charcoal bg-charcoal text-ivory"
                        : "border border-border text-charcoal hover:border-taupe"
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        {optionValues.length > 0 ? (
          <fieldset className="mt-8">
            <legend className="text-12 tracking-label text-black">
              {isPerfume ? "Hacim" : "Beden"}
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {optionValues.map((value) => {
                const selected = option === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setOption(value)}
                    aria-pressed={selected}
                    className={`h-12 min-w-12 px-4 text-12 tracking-nav ${
                      selected
                        ? "border border-charcoal bg-charcoal text-ivory"
                        : "border border-border text-charcoal hover:border-taupe"
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
            {!isPerfume ? (
              <button
                type="button"
                onClick={() => setSizeGuideOpen(true)}
                className="mt-4 text-12 tracking-nav text-taupe transition-colors hover:text-black"
              >
                Beden Rehberi
              </button>
            ) : null}
          </fieldset>
        ) : null}

        <div className="mt-8">
          <p className="text-12 tracking-label text-black">Adet</p>
          <div className="mt-3 inline-flex h-12 items-center border border-border">
            <button
              type="button"
              aria-label="Azalt"
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              className="flex h-12 w-12 items-center justify-center text-charcoal"
            >
              <Minus size={14} strokeWidth={1.4} />
            </button>
            <span className="min-w-8 text-center text-14 text-black">{quantity}</span>
            <button
              type="button"
              aria-label="Artır"
              onClick={() =>
                setQuantity((current) => Math.min(maxQuantity, current + 1))
              }
              className="flex h-12 w-12 items-center justify-center text-charcoal"
            >
              <Plus size={14} strokeWidth={1.4} />
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleAddToBag}
            aria-live="polite"
            className="inline-flex h-12 items-center justify-center bg-charcoal px-8 text-12 tracking-nav text-ivory transition-colors hover:bg-black"
          >
            {added ? (
              <span className="inline-flex items-center gap-2">
                Eklendi
                <Check size={14} strokeWidth={1.6} />
              </span>
            ) : (
              "Sepete Ekle"
            )}
          </button>
          <button
            type="button"
            onClick={() => toggleItem(product.id)}
            aria-pressed={favorited}
            className="inline-flex h-12 items-center justify-center gap-2 border border-charcoal px-8 text-12 tracking-nav text-charcoal transition-colors hover:bg-charcoal hover:text-ivory"
          >
            <Heart
              size={14}
              strokeWidth={1.4}
              className={favorited ? "fill-current" : ""}
            />
            {favorited ? "Favorilerde" : "Favorilerime Ekle"}
          </button>
          <ShareProductButton
            name={product.name}
            slug={product.slug}
            className="inline-flex h-12 items-center justify-center gap-2 border border-border px-8 text-12 tracking-nav text-charcoal transition-colors hover:border-charcoal"
          />
        </div>

        {product.perfumeDetails ? (
          <div className="mt-12">
            <FragranceProfile details={product.perfumeDetails} />
          </div>
        ) : null}

        <div className="mt-12">
          <ProductAccordion items={accordionItems} />
        </div>
      </div>
    </div>

      <SizeGuideModal
        isOpen={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
      />
    </>
  );
}
