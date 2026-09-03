import { Prisma } from "@prisma/client";

import { badRequest, conflict, notFound } from "@/server/api/errors";
import { getPrisma } from "@/server/db/prisma";
import { toCategoryDetailDto, toCategoryDto } from "@/server/dto/catalog";
import {
  optionalBoolean,
  optionalString,
  optionalStringArray,
  parseQueryBoolean,
  parseQueryString,
  requireId,
  requireString,
  hasField,
} from "@/server/utils/validation";
import { toSlug } from "@/lib/utils";
import type { CategoryDetailDto, CategoryDto } from "@/types/api";

type CategoryWriteInput = {
  name?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  subcategories?: string[];
};

const CATEGORY_TREE_INCLUDE = {
  parent: { select: { id: true, name: true, slug: true } },
  children: {
    select: { id: true, name: true, slug: true, isActive: true },
    orderBy: { name: "asc" as const },
  },
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
      ...CATEGORY_TREE_INCLUDE,
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

async function allocateSlug(base: string, excludeId?: string): Promise<string> {
  const root = toSlug(base) || "kategori";
  for (let index = 0; index < 40; index += 1) {
    const slug = index === 0 ? root : `${root}-${index + 1}`;
    const existing = await getPrisma().category.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) {
      return slug;
    }
  }
  badRequest("Could not allocate a unique subcategory slug");
}

async function syncSubcategories(
  parentId: string,
  names: string[],
): Promise<void> {
  const parent = await getPrisma().category.findUniqueOrThrow({
    where: { id: parentId },
    include: { children: true },
  });

  if (parent.parentId) {
    badRequest("Alt kategoriye alt kategori eklenemez");
  }

  const wanted = [
    ...new Set(names.map((name) => name.trim()).filter(Boolean)),
  ];
  const remaining = [...parent.children];

  for (const name of wanted) {
    const slugHint = toSlug(name);
    const match = remaining.find(
      (child) => child.name === name || child.slug === slugHint,
    );
    if (match) {
      await getPrisma().category.update({
        where: { id: match.id },
        data: { name, isActive: true },
      });
      remaining.splice(remaining.indexOf(match), 1);
      continue;
    }

    await getPrisma().category.create({
      data: {
        name,
        slug: await allocateSlug(name),
        description: "",
        isActive: true,
        parentId,
      },
    });
  }

  for (const extra of remaining) {
    const productCount = await getPrisma().product.count({
      where: { categoryId: extra.id },
    });
    if (productCount > 0) {
      await getPrisma().category.update({
        where: { id: extra.id },
        data: { isActive: false },
      });
      continue;
    }
    await getPrisma().category.delete({ where: { id: extra.id } });
  }
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
    description: optionalString(body, "description", 8000) ?? "",
    isActive: optionalBoolean(body, "isActive") ?? true,
    subcategories: optionalStringArray(body, "subcategories", 30, 80) ?? [],
  };
}

export function parsePatchCategory(
  body: Record<string, unknown>,
): CategoryWriteInput {
  const patch: CategoryWriteInput = {
    description: optionalString(body, "description", 8000),
    isActive: optionalBoolean(body, "isActive"),
    subcategories: optionalStringArray(body, "subcategories", 30, 80),
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
    parentId: null,
  };

  if (input.search) {
    where.OR = [
      { name: { contains: input.search, mode: "insensitive" } },
      { description: { contains: input.search, mode: "insensitive" } },
    ];
  }

  const categories = await getPrisma().category.findMany({
    where,
    include: CATEGORY_TREE_INCLUDE,
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });

  return categories.map(toCategoryDto);
}

export async function getCategoryById(
  id: string,
  options?: { includeInactive?: boolean },
): Promise<CategoryDetailDto> {
  const category = await requireCategory(requireId(id));
  if (!category.isActive && !options?.includeInactive) {
    notFound("Category not found");
  }

  const dto = toCategoryDetailDto(category);
  if (!options?.includeInactive) {
    dto.products = dto.products.filter((product) => product.isActive);
  }
  return dto;
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
    if (input.subcategories.length > 0) {
      await syncSubcategories(category.id, input.subcategories);
    }
    return toCategoryDto(await requireCategory(category.id));
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
    await getPrisma().category.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        isActive: input.isActive,
      },
    });
    if (input.subcategories) {
      await syncSubcategories(id, input.subcategories);
    }
    return toCategoryDto(await requireCategory(id));
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
    include: CATEGORY_TREE_INCLUDE,
  });

  return toCategoryDto(category);
}
