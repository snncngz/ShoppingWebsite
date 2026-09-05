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
  const hasDiscount = Boolean(pricing.discountPercent);

  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      {pricing.oldPrice ? (
        <span className={mutedClass}>{formatPrice(pricing.oldPrice)}</span>
      ) : null}
      {hasDiscount ? (
        <span className={mutedClass}>{formatPrice(pricing.listPrice)}</span>
      ) : (
        <span className={saleClass}>{formatPrice(pricing.listPrice)}</span>
      )}
      {hasDiscount ? (
        <>
          <span className={saleClass}>{formatPrice(pricing.price)}</span>
          <span className="text-12 tracking-label text-accent">
            İndirim · %{pricing.discountPercent}
          </span>
        </>
      ) : null}
    </span>
  );
}
