import type { OrderStatus } from "@/types";
import type { OrderStatusDto } from "@/types/api";

import { NEXT_ORDER_SEQUENCE_START, ORDER_SEQ_KEY } from "@/lib/auth";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Beklemede",
  confirmed: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
  cancelled: "İptal",
};

export const ADMIN_ORDER_STATUS_LABELS: Record<OrderStatusDto, string> = {
  PENDING: "Beklemede",
  PAID: "Ödendi",
  PROCESSING: "Hazırlanıyor",
  SHIPPED: "Kargoda",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "İptal",
};

export const ADMIN_ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const satisfies readonly OrderStatusDto[];

export function formatOrderNumber(id: string): string {
  return id.startsWith("#") ? id : `#${id}`;
}

export function formatOrderDate(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function nextCheckoutOrderNumber(): string {
  const raw = window.localStorage.getItem(ORDER_SEQ_KEY);
  const last = raw ? Number.parseInt(raw, 10) : NEXT_ORDER_SEQUENCE_START;
  const next =
    Number.isFinite(last) && last >= NEXT_ORDER_SEQUENCE_START
      ? last + 1
      : NEXT_ORDER_SEQUENCE_START + 1;

  window.localStorage.setItem(ORDER_SEQ_KEY, String(next));
  return `#BTQ-${next}`;
}
