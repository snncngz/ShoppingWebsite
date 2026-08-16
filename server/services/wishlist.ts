import type { Wishlist, WishlistItem } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { badRequest, notFound } from "@/server/api/errors";
import { getPrisma } from "@/server/db/prisma";
import {
  productCategoryInclude,
  toProductDto,
} from "@/server/dto/catalog";
import { requireId, requireString } from "@/server/utils/validation";
import type { WishlistDto, WishlistItemDto } from "@/types/api";

const wishlistItemInclude = {
  product: { include: productCategoryInclude },
} satisfies Prisma.WishlistItemInclude;

type WishlistItemWithProduct = Prisma.WishlistItemGetPayload<{
  include: typeof wishlistItemInclude;
}>;

type WishlistWithItems = Wishlist & {
  items: WishlistItemWithProduct[];
};

function isUniqueWishlistItemError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function toWishlistItemDto(item: WishlistItemWithProduct): WishlistItemDto {
  return {
    id: item.id,
    productId: item.productId,
    product: toProductDto(item.product),
    createdAt: item.createdAt.toISOString(),
  };
}

function toWishlistDto(wishlist: WishlistWithItems): WishlistDto {
  return {
    id: wishlist.id,
    items: wishlist.items.map(toWishlistItemDto),
  };
}

async function loadWishlist(wishlistId: string): Promise<WishlistWithItems> {
  return getPrisma().wishlist.findUniqueOrThrow({
    where: { id: wishlistId },
    include: {
      items: {
        include: wishlistItemInclude,
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      },
    },
  });
}

export async function getOrCreateWishlist(userId: string): Promise<Wishlist> {
  return getPrisma().wishlist.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

async function requireOwnedWishlistItem(
  userId: string,
  itemId: string,
): Promise<WishlistItem & { wishlist: Wishlist }> {
  const item = await getPrisma().wishlistItem.findUnique({
    where: { id: itemId },
    include: { wishlist: true },
  });

  if (!item || item.wishlist.userId !== userId) {
    notFound("Wishlist item not found");
  }

  return item;
}

export function parseAddWishlistItem(body: Record<string, unknown>): {
  productId: string;
} {
  return { productId: requireString(body, "productId") };
}

export function parseMergeWishlistItems(body: Record<string, unknown>): string[] {
  const productIds = body.productIds;
  if (!Array.isArray(productIds)) {
    badRequest("productIds must be an array of strings");
  }

  if (productIds.length > 40) {
    badRequest("productIds must contain at most 40 items");
  }

  const ids: string[] = [];
  for (const value of productIds) {
    if (typeof value !== "string") {
      badRequest("productIds must be an array of strings");
    }

    const id = value.trim();
    if (id.length > 64) {
      badRequest("productIds contains an invalid id");
    }
    if (id) {
      ids.push(id);
    }
  }

  return [...new Set(ids)];
}

export async function getWishlist(userId: string): Promise<WishlistDto> {
  const wishlist = await getOrCreateWishlist(userId);
  return toWishlistDto(await loadWishlist(wishlist.id));
}

export async function addWishlistItem(
  userId: string,
  productId: string,
): Promise<WishlistDto> {
  const product = await getPrisma().product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    notFound("Product not found");
  }

  if (!product.isActive) {
    badRequest("Product is not available");
  }

  const wishlist = await getOrCreateWishlist(userId);
  const existing = await getPrisma().wishlistItem.findUnique({
    where: {
      wishlistId_productId: {
        wishlistId: wishlist.id,
        productId: product.id,
      },
    },
  });

  if (!existing) {
    try {
      await getPrisma().wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          productId: product.id,
        },
      });
    } catch (error) {
      if (!isUniqueWishlistItemError(error)) {
        throw error;
      }
    }
  }

  return toWishlistDto(await loadWishlist(wishlist.id));
}

export async function deleteWishlistItem(
  userId: string,
  itemId: string,
): Promise<WishlistDto> {
  const item = await requireOwnedWishlistItem(userId, requireId(itemId));
  await getPrisma().wishlistItem.delete({ where: { id: item.id } });
  return toWishlistDto(await loadWishlist(item.wishlistId));
}

export async function mergeWishlistItems(
  userId: string,
  productIds: string[],
): Promise<WishlistDto> {
  const wishlist = await getOrCreateWishlist(userId);

  for (const productId of productIds) {
    const product = await getPrisma().product.findUnique({
      where: { id: productId },
    });
    if (!product || !product.isActive) {
      continue;
    }

    try {
      await getPrisma().wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          productId: product.id,
        },
      });
    } catch (error) {
      if (!isUniqueWishlistItemError(error)) {
        throw error;
      }
    }
  }

  return toWishlistDto(await loadWishlist(wishlist.id));
}
