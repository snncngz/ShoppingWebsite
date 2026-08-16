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

export function readGuestCartItems(raw: string | null): CartItem[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    const items = Array.isArray(parsed)
      ? parsed
      : parsed &&
          typeof parsed === "object" &&
          Array.isArray((parsed as { items?: unknown }).items)
        ? (parsed as { items: unknown[] }).items
        : [];
    return items.filter(isCartItem);
  } catch {
    return [];
  }
}

export function readGuestWishlistIds(raw: string | null): string[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    const ids = Array.isArray(parsed)
      ? parsed
      : parsed &&
          typeof parsed === "object" &&
          Array.isArray((parsed as { ids?: unknown }).ids)
        ? (parsed as { ids: unknown[] }).ids
        : [];
    return ids.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}
