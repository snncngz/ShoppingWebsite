import { Prisma } from "@prisma/client";

import { badRequest, conflict, notFound } from "@/server/api/errors";
import { getPrisma } from "@/server/db/prisma";
import { toCategoryDetailDto, toCategoryDto } from "@/server/dto/catalog";
import {
  optionalBoolean,
  optionalString,
  parseQueryBoolean,
  parseQueryString,
  requireId,
  requireString,
  hasField,
} from "@/server/utils/validation";
import type { CategoryDetailDto, CategoryDto } from "@/types/api";

type CategoryWriteInput = {
  name?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
};

function isUniqueSlugError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function requireCategory(id: string) {
  const category = await getPrisma().category.findUnique({
    where: { id },
    include: {
      products: {
        select: { id: true, name: true, slug: true, isActive: true },
        orderBy: { name: "asc" },
        take: 50,
      },
    },
  });

  if (!category) {
    notFound("Category not found");
  }

  return category;
}

export function readCategoryListQuery(params: URLSearchParams) {
  return {
    search: parseQueryString(params.get("search")),
    isActive: parseQueryBoolean(params.get("isActive"), "isActive", true),
  };
}

export function parseCreateCategory(body: Record<string, unknown>) {
  return {
    name: requireString(body, "name"),
    slug: requireString(body, "slug"),
    description: optionalString(body, "description") ?? "",
    isActive: optionalBoolean(body, "isActive") ?? true,
  };
}

export function parsePatchCategory(
  body: Record<string, unknown>,
): CategoryWriteInput {
  const patch: CategoryWriteInput = {
    description: optionalString(body, "description"),
    isActive: optionalBoolean(body, "isActive"),
  };

  if (hasField(body, "name")) {
    patch.name = requireString(body, "name");
  }
  if (hasField(body, "slug")) {
    patch.slug = requireString(body, "slug");
  }

  if (Object.values(patch).every((value) => value === undefined)) {
    badRequest("No fields to update");
  }

  return patch;
}

export async function listCategories(input: {
  search?: string;
  isActive: boolean;
}): Promise<CategoryDto[]> {
  const where: Prisma.CategoryWhereInput = {
    isActive: input.isActive,
  };

  if (input.search) {
    where.OR = [
      { name: { contains: input.search, mode: "insensitive" } },
      { description: { contains: input.search, mode: "insensitive" } },
    ];
  }

  const categories = await getPrisma().category.findMany({
    where,
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });

  return categories.map(toCategoryDto);
}

export async function getCategoryById(id: string): Promise<CategoryDetailDto> {
  return toCategoryDetailDto(await requireCategory(requireId(id)));
}

export async function createCategory(
  input: ReturnType<typeof parseCreateCategory>,
): Promise<CategoryDto> {
  try {
    const category = await getPrisma().category.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        isActive: input.isActive,
      },
    });
    return toCategoryDto(category);
  } catch (error) {
    if (isUniqueSlugError(error)) {
      conflict("Category slug already exists");
    }
    throw error;
  }
}

export async function updateCategory(
  id: string,
  input: CategoryWriteInput,
): Promise<CategoryDto> {
  await requireCategory(requireId(id));

  try {
    const category = await getPrisma().category.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        isActive: input.isActive,
      },
    });
    return toCategoryDto(category);
  } catch (error) {
    if (isUniqueSlugError(error)) {
      conflict("Category slug already exists");
    }
    throw error;
  }
}

export async function hideCategory(id: string): Promise<CategoryDto> {
  await requireCategory(requireId(id));

  const category = await getPrisma().category.update({
    where: { id },
    data: { isActive: false },
  });

  return toCategoryDto(category);
}
