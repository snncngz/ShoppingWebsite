import { adminRequest } from "@/lib/adminApi";
import type {
  AdminOrderDetailDto,
  AdminOrderListItemDto,
  OrderStatusDto,
  PaginatedDto,
} from "@/types/api";

export type AdminOrderListQuery = {
  page?: number;
  limit?: number;
  status?: OrderStatusDto | "all";
  search?: string;
};

export async function listAdminOrders(
  query: AdminOrderListQuery = {},
): Promise<PaginatedDto<AdminOrderListItemDto>> {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 20));
  if (query.status && query.status !== "all") {
    params.set("status", query.status);
  }
  if (query.search?.trim()) {
    params.set("search", query.search.trim());
  }

  return adminRequest<PaginatedDto<AdminOrderListItemDto>>(
    `/api/admin/orders?${params.toString()}`,
  );
}

export async function getAdminOrder(id: string): Promise<AdminOrderDetailDto> {
  return adminRequest<AdminOrderDetailDto>(`/api/admin/orders/${id}`);
}

export async function updateAdminOrderStatus(
  id: string,
  status: OrderStatusDto,
): Promise<AdminOrderDetailDto> {
  return adminRequest<AdminOrderDetailDto>(`/api/admin/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
