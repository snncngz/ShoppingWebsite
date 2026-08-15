import type { CartItem } from "@/types";

export const CART_STORAGE_KEY = "velora-cart";
export const WISHLIST_STORAGE_KEY = "velora-wishlist";
export const FREE_SHIPPING_THRESHOLD = 500;
export const SHIPPING_FEE = 149;

export function getCartLineKey(
  productId: string,
  color: string,
  size: string,
): string {
  return `${productId}::${color}::${size}`;
}

export function getCartQuantity(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function getShippingFee(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

export function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<CartItem>;

  return (
    typeof item.id === "string" &&
    typeof item.productId === "string" &&
    typeof item.quantity === "number" &&
    item.quantity > 0 &&
    typeof item.color === "string" &&
    typeof item.size === "string"
  );
}
