import { OrderStatus, Prisma } from "@prisma/client";

import { GIFT_WRAP_FEE } from "@/lib/cart";
import { toPerfumeDetails } from "@/lib/mappers/product";
import { displayPricing } from "@/lib/pricing";
import { badRequest, conflict, notFound } from "@/server/api/errors";
import { getPrisma } from "@/server/db/prisma";
import { decimalToNumber, toDecimal, toProductSummaryDto } from "@/server/dto/catalog";
import { decrementStockForSale } from "@/server/services/inventory";
import { optionalBoolean, requireId } from "@/server/utils/validation";
import type { OrderDto, OrderItemDto } from "@/types/api";

const orderInclude = {
  items: {
    include: {
      product: {
        select: { id: true, name: true, slug: true, isActive: true },
      },
    },
    orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
  },
} satisfies Prisma.OrderInclude;

type OrderWithItems = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;

function toOrderItemDto(
  item: OrderWithItems["items"][number],
): OrderItemDto {
  const unitPrice = decimalToNumber(item.unitPrice);
  return {
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    unitPrice,
    lineTotal: Number((unitPrice * item.quantity).toFixed(2)),
    variant: item.variant,
    product: toProductSummaryDto(item.product),
    createdAt: item.createdAt.toISOString(),
  };
}

function toOrderDto(order: OrderWithItems): OrderDto {
  return {
    id: order.id,
    status: order.status,
    total: decimalToNumber(order.total),
    giftWrap: order.giftWrap,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map(toOrderItemDto),
  };
}

export async function listOrders(userId: string): Promise<OrderDto[]> {
  const orders = await getPrisma().order.findMany({
    where: { userId },
    include: orderInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  return orders.map(toOrderDto);
}

export async function getOrder(userId: string, orderId: string): Promise<OrderDto> {
  const order = await getPrisma().order.findUnique({
    where: { id: requireId(orderId) },
    include: orderInclude,
  });

  if (!order || order.userId !== userId) {
    notFound("Order not found");
  }

  return toOrderDto(order);
}

export function parseCreateOrder(body: Record<string, unknown>): {
  giftWrap: boolean;
} {
  return {
    giftWrap: optionalBoolean(body, "giftWrap") ?? false,
  };
}

export async function createOrder(
  userId: string,
  input: { giftWrap: boolean } = { giftWrap: false },
): Promise<OrderDto> {
  return getPrisma().$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart || cart.items.length === 0) {
      badRequest("Cart is empty");
    }

    const products = await tx.product.findMany({
      where: { id: { in: cart.items.map((item) => item.productId) } },
    });
    const productById = new Map(products.map((product) => [product.id, product]));

    for (const item of cart.items) {
      const product = productById.get(item.productId);
      if (!product || !product.isActive) {
        conflict("One or more products are not available");
      }
      if (product.stock < item.quantity) {
        conflict("Insufficient stock");
      }
    }

    let total = new Prisma.Decimal(0);
    const lines = cart.items.map((item) => {
      const product = productById.get(item.productId);
      if (!product) {
        conflict("One or more products are not available");
      }
      const unit = displayPricing(
        {
          price: decimalToNumber(product.price),
          oldPrice: product.oldPrice ? decimalToNumber(product.oldPrice) : null,
          campaignPercent: product.campaignPercent,
          perfumeDetails: toPerfumeDetails(product.perfumeDetails),
        },
        item.variant,
      ).price;
      const unitPrice = toDecimal(unit);
      total = total.add(unitPrice.mul(item.quantity));
      return {
        productId: product.id,
        quantity: item.quantity,
        unitPrice,
        variant: item.variant,
      };
    });

    if (input.giftWrap) {
      total = total.add(toDecimal(GIFT_WRAP_FEE));
    }

    const created = await tx.order.create({
      data: {
        userId,
        status: OrderStatus.PAID,
        total,
        giftWrap: input.giftWrap,
        items: {
          create: lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            variant: line.variant,
          })),
        },
      },
    });

    for (const line of lines) {
      await decrementStockForSale(tx, {
        productId: line.productId,
        quantity: line.quantity,
        orderId: created.id,
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    const order = await tx.order.findUniqueOrThrow({
      where: { id: created.id },
      include: orderInclude,
    });

    return toOrderDto(order);
  });
}
