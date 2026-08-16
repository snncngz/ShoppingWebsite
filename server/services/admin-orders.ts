import { OrderStatus, Prisma } from "@prisma/client";

import { badRequest, notFound } from "@/server/api/errors";
import { getPrisma } from "@/server/db/prisma";
import { decimalToNumber, toProductSummaryDto } from "@/server/dto/catalog";
import {
  parseQueryPositiveInt,
  parseQueryString,
  requireId,
} from "@/server/utils/validation";
import type {
  AdminOrderDetailDto,
  AdminOrderListItemDto,
  OrderCustomerDto,
  OrderItemDto,
  OrderStatusDto,
  PaginatedDto,
} from "@/types/api";

export const ORDER_STATUSES: OrderStatusDto[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

const adminOrderInclude = {
  user: {
    select: { id: true, name: true, email: true },
  },
  items: {
    include: {
      product: {
        select: { id: true, name: true, slug: true, isActive: true },
      },
    },
    orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
  },
} satisfies Prisma.OrderInclude;

type AdminOrderRecord = Prisma.OrderGetPayload<{
  include: typeof adminOrderInclude;
}>;

export type AdminOrderListInput = {
  page: number;
  limit: number;
  status?: OrderStatus;
  search?: string;
};

function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as string[]).includes(value);
}

function toCustomerDto(user: OrderCustomerDto): OrderCustomerDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

function toOrderItemDto(
  item: AdminOrderRecord["items"][number],
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

function toAdminOrderDetailDto(order: AdminOrderRecord): AdminOrderDetailDto {
  return {
    id: order.id,
    status: order.status,
    total: decimalToNumber(order.total),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map(toOrderItemDto),
    user: toCustomerDto(order.user),
  };
}

export function readAdminOrderListQuery(
  params: URLSearchParams,
): AdminOrderListInput {
  const limit = Math.min(
    parseQueryPositiveInt(params.get("limit"), "limit", DEFAULT_LIMIT),
    MAX_LIMIT,
  );
  const statusRaw = parseQueryString(params.get("status"));
  let status: OrderStatus | undefined;
  if (statusRaw) {
    if (!isOrderStatus(statusRaw)) {
      badRequest("status is invalid");
    }
    status = statusRaw;
  }

  return {
    page: parseQueryPositiveInt(params.get("page"), "page", 1),
    limit,
    status,
    search: parseQueryString(params.get("search")),
  };
}

export function parseAdminOrderStatusPatch(
  body: Record<string, unknown>,
): OrderStatus {
  const status = body.status;
  if (typeof status !== "string" || !isOrderStatus(status)) {
    badRequest("status is invalid");
  }
  return status;
}

export async function listAdminOrders(
  input: AdminOrderListInput,
): Promise<PaginatedDto<AdminOrderListItemDto>> {
  const where: Prisma.OrderWhereInput = {};
  if (input.status) {
    where.status = input.status;
  }
  if (input.search) {
    where.OR = [
      { id: { contains: input.search, mode: "insensitive" } },
      { user: { name: { contains: input.search, mode: "insensitive" } } },
      { user: { email: { contains: input.search, mode: "insensitive" } } },
    ];
  }

  const skip = (input.page - 1) * input.limit;
  const [total, rows] = await getPrisma().$transaction([
    getPrisma().order.count({ where }),
    getPrisma().order.findMany({
      where,
      skip,
      take: input.limit,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  return {
    items: rows.map((order) => ({
      id: order.id,
      status: order.status,
      total: decimalToNumber(order.total),
      createdAt: order.createdAt.toISOString(),
      itemCount: order._count.items,
      user: toCustomerDto(order.user),
    })),
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / input.limit),
    },
  };
}

export async function getAdminOrder(orderId: string): Promise<AdminOrderDetailDto> {
  const order = await getPrisma().order.findUnique({
    where: { id: requireId(orderId) },
    include: adminOrderInclude,
  });

  if (!order) {
    notFound("Order not found");
  }

  return toAdminOrderDetailDto(order);
}

export async function updateAdminOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<AdminOrderDetailDto> {
  const existing = await getPrisma().order.findUnique({
    where: { id: requireId(orderId) },
    select: { id: true },
  });
  if (!existing) {
    notFound("Order not found");
  }

  const order = await getPrisma().order.update({
    where: { id: existing.id },
    data: { status },
    include: adminOrderInclude,
  });

  return toAdminOrderDetailDto(order);
}
