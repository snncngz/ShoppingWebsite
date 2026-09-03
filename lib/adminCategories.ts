import { adminRequest } from "@/lib/adminApi";
import type { CategoryDto } from "@/types/api";

export type AdminCategoryWriteInput = {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  parentId?: string;
  subcategories?: string[];
};

export type AdminCategoryPatchInput = {
  name?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  subcategories?: string[];
};

async function fetchCategories(isActive: boolean): Promise<CategoryDto[]> {
  return adminRequest<CategoryDto[]>(`/api/categories?isActive=${isActive}`);
}

export async function listAdminApiCategories(): Promise<CategoryDto[]> {
  const [active, inactive] = await Promise.all([
    fetchCategories(true),
    fetchCategories(false),
  ]);

  return [...active, ...inactive].sort((a, b) =>
    a.name.localeCompare(b.name, "tr"),
  );
}

export async function createAdminApiCategory(
  input: AdminCategoryWriteInput,
): Promise<CategoryDto> {
  return adminRequest<CategoryDto>("/api/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAdminApiCategory(
  id: string,
  input: AdminCategoryPatchInput,
): Promise<CategoryDto> {
  return adminRequest<CategoryDto>(`/api/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function setAdminApiCategoryActive(
  id: string,
  isActive: boolean,
): Promise<CategoryDto> {
  return updateAdminApiCategory(id, { isActive });
}

export async function deleteAdminApiCategory(id: string): Promise<{ id: string }> {
  return adminRequest<{ id: string }>(`/api/categories/${id}`, {
    method: "DELETE",
  });
}
