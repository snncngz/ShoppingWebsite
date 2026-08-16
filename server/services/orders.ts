import { OrderStatus, Prisma } from "@prisma/client";

import { badRequest, conflict, notFound } from "@/server/api/errors";
import { getPrisma } from "@/server/db/prisma";
import { decimalToNumber, toProductSummaryDto } from "@/server/dto/catalog";
import { decrementStockForSale } from "@/server/services/inventory";
import { requireId } from "@/server/utils/validation";
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
    product: toProductSummaryDto(item.product),
    createdAt: item.createdAt.toISOString(),
  };
}

function toOrderDto(order: OrderWithItems): OrderDto {
  return {
    id: order.id,
    status: order.status,
    total: decimalToNumber(order.total),
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

export async function createOrder(userId: string): Promise<OrderDto> {
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
      total = total.add(product.price.mul(item.quantity));
      return {
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
      };
    });

    const created = await tx.order.create({
      data: {
        userId,
        status: OrderStatus.PENDING,
        total,
        items: {
          create: lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
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
