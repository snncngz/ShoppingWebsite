import { adminRequest } from "@/lib/adminApi";
import type {
  AdminInventoryItemDto,
  InventoryMovementDto,
  PaginatedDto,
  StockStatusDto,
} from "@/types/api";

export type AdminInventoryListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  lowStock?: boolean;
  stockStatus?: StockStatusDto | "all";
};

export async function listAdminInventory(
  query: AdminInventoryListQuery = {},
): Promise<PaginatedDto<AdminInventoryItemDto>> {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 20));
  if (query.search?.trim()) {
    params.set("search", query.search.trim());
  }
  if (query.lowStock) {
    params.set("lowStock", "true");
  }
  if (query.stockStatus && query.stockStatus !== "all") {
    params.set("stockStatus", query.stockStatus);
  }

  return adminRequest<PaginatedDto<AdminInventoryItemDto>>(
    `/api/admin/inventory?${params.toString()}`,
  );
}

export async function getAdminInventory(
  productId: string,
): Promise<AdminInventoryItemDto> {
  return adminRequest<AdminInventoryItemDto>(
    `/api/admin/inventory/${productId}`,
  );
}

export async function updateAdminInventory(
  productId: string,
  input: {
    stock?: number;
    lowStockThreshold?: number;
    reason?: string;
  },
): Promise<AdminInventoryItemDto> {
  return adminRequest<AdminInventoryItemDto>(
    `/api/admin/inventory/${productId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export async function listAdminInventoryMovements(
  productId: string,
  query: { page?: number; limit?: number } = {},
): Promise<PaginatedDto<InventoryMovementDto>> {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 20));
  return adminRequest<PaginatedDto<InventoryMovementDto>>(
    `/api/admin/inventory/${productId}/movements?${params.toString()}`,
  );
}
