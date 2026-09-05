import type { Cart, CartItem, Product } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { badRequest, notFound } from "@/server/api/errors";
import { getPrisma } from "@/server/db/prisma";
import {
  productCategoryInclude,
  toProductDto,
  type ProductWithCategory,
} from "@/server/dto/catalog";
import {
  hasField,
  requireId,
  requirePositiveInt,
  requireString,
} from "@/server/utils/validation";
import type { CartDto, CartItemDto } from "@/types/api";

const cartItemInclude = {
  product: { include: productCategoryInclude },
} satisfies Prisma.CartItemInclude;

type CartItemWithProduct = Prisma.CartItemGetPayload<{
  include: typeof cartItemInclude;
}>;

type CartWithItems = Cart & {
  items: CartItemWithProduct[];
};

function isUniqueCartItemError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function toCartItemDto(item: CartItemWithProduct): CartItemDto {
  return {
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    variant: item.variant,
    product: toProductDto(item.product),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function toCartDto(cart: CartWithItems): CartDto {
  return {
    id: cart.id,
    items: cart.items.map(toCartItemDto),
  };
}

async function loadCart(cartId: string): Promise<CartWithItems> {
  return getPrisma().cart.findUniqueOrThrow({
    where: { id: cartId },
    include: {
      items: {
        include: cartItemInclude,
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      },
    },
  });
}

export async function getOrCreateCart(userId: string): Promise<Cart> {
  return getPrisma().cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

async function requireSellableProduct(productId: string): Promise<ProductWithCategory> {
  const product = await getPrisma().product.findUnique({
    where: { id: productId },
    include: productCategoryInclude,
  });

  if (!product) {
    notFound("Product not found");
  }

  if (!product.isActive) {
    badRequest("Product is not available");
  }

  if (product.stock <= 0) {
    badRequest("Product is out of stock");
  }

  return product;
}

function assertQuantityWithinStock(quantity: number, stock: number): void {
  if (quantity > stock) {
    badRequest("Requested quantity exceeds stock");
  }
}

async function requireOwnedCartItem(
  userId: string,
  itemId: string,
): Promise<CartItem & { cart: Cart; product: Product }> {
  const item = await getPrisma().cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true, product: true },
  });

  if (!item || item.cart.userId !== userId) {
    notFound("Cart item not found");
  }

  return item;
}

function parseCartVariant(body: Record<string, unknown>): string {
  const raw = hasField(body, "variant")
    ? body.variant
    : hasField(body, "size")
      ? body.size
      : "";
  if (raw === undefined || raw === null) {
    return "";
  }
  if (typeof raw !== "string") {
    badRequest("variant must be a string");
  }
  return raw.trim().slice(0, 40);
}

export function parseAddCartItem(body: Record<string, unknown>): {
  productId: string;
  quantity: number;
  variant: string;
} {
  return {
    productId: requireString(body, "productId"),
    quantity: hasField(body, "quantity")
      ? requirePositiveInt(body, "quantity", 50)
      : 1,
    variant: parseCartVariant(body),
  };
}

export function parseUpdateCartItem(body: Record<string, unknown>): {
  quantity: number;
} {
  return {
    quantity: requirePositiveInt(body, "quantity", 50),
  };
}

export function parseMergeCartItems(body: Record<string, unknown>): {
  productId: string;
  quantity: number;
  variant: string;
}[] {
  const items = body.items;
  if (!Array.isArray(items)) {
    badRequest("items must be an array");
  }

  if (items.length > 40) {
    badRequest("items must contain at most 40 entries");
  }

  return items.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      badRequest(`items[${index}] must be an object`);
    }

    const record = entry as Record<string, unknown>;
    return {
      productId: requireString(record, "productId"),
      quantity: hasField(record, "quantity")
        ? requirePositiveInt(record, "quantity", 50)
        : 1,
      variant: parseCartVariant(record),
    };
  });
}

export async function getCart(userId: string): Promise<CartDto> {
  const cart = await getOrCreateCart(userId);
  return toCartDto(await loadCart(cart.id));
}

export async function addCartItem(
  userId: string,
  input: { productId: string; quantity: number; variant: string },
): Promise<CartDto> {
  const product = await requireSellableProduct(input.productId);
  const cart = await getOrCreateCart(userId);
  const variant = input.variant;
  const existing = await getPrisma().cartItem.findUnique({
    where: {
      cartId_productId_variant: {
        cartId: cart.id,
        productId: product.id,
        variant,
      },
    },
  });

  const nextQuantity = (existing?.quantity ?? 0) + input.quantity;
  assertQuantityWithinStock(nextQuantity, product.stock);

  if (existing) {
    await getPrisma().cartItem.update({
      where: { id: existing.id },
      data: { quantity: nextQuantity },
    });
  } else {
    try {
      await getPrisma().cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity: input.quantity,
          variant,
        },
      });
    } catch (error) {
      if (!isUniqueCartItemError(error)) {
        throw error;
      }

      const raced = await getPrisma().cartItem.findUniqueOrThrow({
        where: {
          cartId_productId_variant: {
            cartId: cart.id,
            productId: product.id,
            variant,
          },
        },
      });
      const racedQuantity = raced.quantity + input.quantity;
      assertQuantityWithinStock(racedQuantity, product.stock);
      await getPrisma().cartItem.update({
        where: { id: raced.id },
        data: { quantity: racedQuantity },
      });
    }
  }

  return toCartDto(await loadCart(cart.id));
}

export async function updateCartItem(
  userId: string,
  itemId: string,
  input: { quantity: number },
): Promise<CartDto> {
  const item = await requireOwnedCartItem(userId, requireId(itemId));
  if (!item.product.isActive) {
    badRequest("Product is not available");
  }
  if (item.product.stock <= 0) {
    badRequest("Product is out of stock");
  }
  assertQuantityWithinStock(input.quantity, item.product.stock);

  await getPrisma().cartItem.update({
    where: { id: item.id },
    data: { quantity: input.quantity },
  });

  return toCartDto(await loadCart(item.cartId));
}

export async function deleteCartItem(
  userId: string,
  itemId: string,
): Promise<CartDto> {
  const item = await requireOwnedCartItem(userId, requireId(itemId));
  await getPrisma().cartItem.delete({ where: { id: item.id } });
  return toCartDto(await loadCart(item.cartId));
}

export async function clearCart(userId: string): Promise<CartDto> {
  const cart = await getOrCreateCart(userId);
  await getPrisma().cartItem.deleteMany({ where: { cartId: cart.id } });
  return toCartDto(await loadCart(cart.id));
}

export async function mergeCartItems(
  userId: string,
  guestItems: { productId: string; quantity: number; variant: string }[],
): Promise<CartDto> {
  const grouped = new Map<string, { productId: string; variant: string; quantity: number }>();
  for (const item of guestItems) {
    const key = `${item.productId}::${item.variant}`;
    const current = grouped.get(key);
    grouped.set(key, {
      productId: item.productId,
      variant: item.variant,
      quantity: (current?.quantity ?? 0) + item.quantity,
    });
  }

  const cart = await getOrCreateCart(userId);

  for (const groupedItem of grouped.values()) {
    const product = await getPrisma().product.findUnique({
      where: { id: groupedItem.productId },
    });
    if (!product || !product.isActive || product.stock <= 0) {
      continue;
    }

    const existing = await getPrisma().cartItem.findUnique({
      where: {
        cartId_productId_variant: {
          cartId: cart.id,
          productId: product.id,
          variant: groupedItem.variant,
        },
      },
    });
    const nextQuantity = Math.min(
      product.stock,
      (existing?.quantity ?? 0) + groupedItem.quantity,
    );
    if (nextQuantity < 1) {
      continue;
    }

    if (existing) {
      await getPrisma().cartItem.update({
        where: { id: existing.id },
        data: { quantity: nextQuantity },
      });
    } else {
      await getPrisma().cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity: nextQuantity,
          variant: groupedItem.variant,
        },
      });
    }
  }

  return toCartDto(await loadCart(cart.id));
}
