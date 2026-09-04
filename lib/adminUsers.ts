import { adminRequest } from "@/lib/adminApi";
import type { AdminUserListItemDto, PaginatedDto } from "@/types/api";

export type AdminUserListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  role?: "USER" | "ADMIN" | "all";
};

export async function listAdminUsers(
  query: AdminUserListQuery = {},
): Promise<PaginatedDto<AdminUserListItemDto>> {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 20));
  if (query.search?.trim()) {
    params.set("search", query.search.trim());
  }
  if (query.role && query.role !== "all") {
    params.set("role", query.role);
  }

  return adminRequest<PaginatedDto<AdminUserListItemDto>>(
    `/api/admin/users?${params.toString()}`,
  );
}

export async function deleteAdminUser(id: string): Promise<{ id: string }> {
  return adminRequest<{ id: string }>(`/api/admin/users/${id}`, {
    method: "DELETE",
  });
}
