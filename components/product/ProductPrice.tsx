import { formatPrice } from "@/lib/utils";
import { displayPricing, toPricedProduct } from "@/lib/pricing";
import type { Product } from "@/types";

export function ProductPrice({
  product,
  variant,
  size = "md",
}: {
  product: Product;
  variant?: string;
  size?: "sm" | "md" | "lg";
}) {
  const pricing = displayPricing(toPricedProduct(product), variant);
  const priceClass =
    size === "lg" ? "text-24 text-black" : size === "sm" ? "text-14 text-charcoal" : "text-14 text-charcoal";
  const oldClass = size === "lg" ? "text-14 text-taupe line-through" : "text-12 text-taupe line-through";

  return (
    <span className="inline-flex flex-wrap items-baseline gap-2">
      <span className={priceClass}>{formatPrice(pricing.price)}</span>
      {pricing.oldPrice ? (
        <span className={oldClass}>{formatPrice(pricing.oldPrice)}</span>
      ) : null}
      {pricing.campaignPercent ? (
        <span className="text-12 tracking-label text-accent">
          Kampanya · %{pricing.campaignPercent}
        </span>
      ) : product.discount ? (
        <span className="text-12 tracking-label text-accent">%{product.discount}</span>
      ) : null}
    </span>
  );
}
