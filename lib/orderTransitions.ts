import type { OrderStatusDto } from "@/types/api";

export const ORDER_STATUS_TRANSITIONS: Record<
  OrderStatusDto,
  readonly OrderStatusDto[]
> = {
  PENDING: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
  PAID: ["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
  PROCESSING: ["SHIPPED", "DELIVERED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function isAllowedOrderStatusTransition(
  from: OrderStatusDto,
  to: OrderStatusDto,
): boolean {
  return from === to || ORDER_STATUS_TRANSITIONS[from].includes(to);
}

export function nextOrderStatuses(from: OrderStatusDto): OrderStatusDto[] {
  return [from, ...ORDER_STATUS_TRANSITIONS[from]];
}
