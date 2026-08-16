import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";
import type {
  CartDto,
  OrderDto,
  PaymentCreateDto,
  PaymentDto,
  WishlistDto,
} from "@/types/api";
import type { CartItem } from "@/types";

export class ShopApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ShopApiError";
    this.status = status;
    this.code = code;
  }
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return Boolean(
    value &&
      typeof value === "object" &&
      "success" in value &&
      value.success === false &&
      "error" in value &&
      typeof value.error === "object" &&
      value.error !== null,
  );
}

async function shopRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers,
      cache: "no-store",
      credentials: "include",
    });
  } catch {
    throw new ShopApiError(0, "INTERNAL_ERROR", "Sunucuya bağlanılamadı.");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ShopApiError(
      response.status,
      "INTERNAL_ERROR",
      "Geçersiz API yanıtı.",
    );
  }

  if (isApiErrorResponse(payload)) {
    throw new ShopApiError(
      response.status,
      payload.error.code,
      payload.error.message,
    );
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    !("success" in payload) ||
    payload.success !== true ||
    !("data" in payload)
  ) {
    throw new ShopApiError(
      response.status,
      "INTERNAL_ERROR",
      "Geçersiz API yanıtı.",
    );
  }

  return (payload as ApiSuccessResponse<T>).data;
}

export async function fetchCart(): Promise<CartDto> {
  return shopRequest<CartDto>("/api/cart");
}

export async function addCartItem(input: {
  productId: string;
  quantity: number;
}): Promise<CartDto> {
  return shopRequest<CartDto>("/api/cart/items", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateCartItem(
  itemId: string,
  quantity: number,
): Promise<CartDto> {
  return shopRequest<CartDto>(`/api/cart/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

export async function deleteCartItem(itemId: string): Promise<CartDto> {
  return shopRequest<CartDto>(`/api/cart/items/${itemId}`, {
    method: "DELETE",
  });
}

export async function clearRemoteCart(): Promise<CartDto> {
  return shopRequest<CartDto>("/api/cart", {
    method: "DELETE",
  });
}

export async function mergeCart(items: CartItem[]): Promise<CartDto> {
  return shopRequest<CartDto>("/api/cart/merge", {
    method: "POST",
    body: JSON.stringify({
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    }),
  });
}

export async function fetchWishlist(): Promise<WishlistDto> {
  return shopRequest<WishlistDto>("/api/wishlist");
}

export async function addWishlistItem(productId: string): Promise<WishlistDto> {
  return shopRequest<WishlistDto>("/api/wishlist/items", {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
}

export async function deleteWishlistItem(itemId: string): Promise<WishlistDto> {
  return shopRequest<WishlistDto>(`/api/wishlist/items/${itemId}`, {
    method: "DELETE",
  });
}

export async function mergeWishlist(productIds: string[]): Promise<WishlistDto> {
  return shopRequest<WishlistDto>("/api/wishlist/merge", {
    method: "POST",
    body: JSON.stringify({ productIds }),
  });
}

export function getShopErrorMessage(error: unknown): string {
  if (error instanceof ShopApiError) {
    if (error.status === 401) {
      return "Sipariş için giriş yapmanız gerekir.";
    }
    if (error.status === 409) {
      return "Stok yetersiz, ürün satışta değil veya sipariş ödenemez.";
    }
    if (error.status === 400) {
      return error.message === "Cart is empty"
        ? "Sepetiniz boş."
        : error.message;
    }
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "İşlem tamamlanamadı.";
}

export async function createOrder(): Promise<OrderDto> {
  return shopRequest<OrderDto>("/api/orders", {
    method: "POST",
  });
}

export async function createPayment(orderId: string): Promise<PaymentCreateDto> {
  return shopRequest<PaymentCreateDto>("/api/payments", {
    method: "POST",
    body: JSON.stringify({ orderId }),
  });
}

export async function fetchPayments(orderId: string): Promise<PaymentDto[]> {
  return shopRequest<PaymentDto[]>(
    `/api/payments?orderId=${encodeURIComponent(orderId)}`,
  );
}

export async function fetchOrders(): Promise<OrderDto[]> {
  return shopRequest<OrderDto[]>("/api/orders");
}

export async function fetchOrder(id: string): Promise<OrderDto> {
  return shopRequest<OrderDto>(`/api/orders/${id}`);
}
