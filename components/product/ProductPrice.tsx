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
  const saleClass =
    size === "lg" ? "text-24 text-black" : "text-14 text-charcoal";
  const mutedClass =
    size === "lg" ? "text-14 text-taupe line-through" : "text-12 text-taupe line-through";
  const current = pricing.discountPercent ? pricing.price : pricing.listPrice;
  const compareAt = pricing.discountPercent
    ? pricing.listPrice
    : pricing.oldPrice && pricing.oldPrice > current
      ? pricing.oldPrice
      : undefined;

  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      {compareAt ? (
        <span className={mutedClass}>{formatPrice(compareAt)}</span>
      ) : null}
      <span className={saleClass}>{formatPrice(current)}</span>
    </span>
  );
}
