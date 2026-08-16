import type { CartItem } from "@/types";
import type { CartItemDto } from "@/types/api";

export function toFrontendCartItem(item: CartItemDto): CartItem {
  return {
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    color: item.product.colors[0] ?? "",
    size: item.product.sizes[0] ?? "",
  };
}

export function applyCartVariant(
  items: CartItem[],
  productId: string,
  color: string,
  size: string,
): CartItem[] {
  return items.map((item) =>
    item.productId === productId ? { ...item, color, size } : item,
  );
}
