import type { Category, Product } from "@prisma/client";
import { Prisma } from "@prisma/client";

import type {
  CategoryChildDto,
  CategoryDetailDto,
  CategoryDto,
  CategorySummaryDto,
  ProductDto,
  ProductSummaryDto,
} from "@/types/api";

export const productCategoryInclude = {
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
          parent: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  },
} satisfies Prisma.ProductInclude;

export type ProductWithCategory = Prisma.ProductGetPayload<{
  include: typeof productCategoryInclude;
}>;

type CategoryWithProducts = Category & {
  products: Pick<Product, "id" | "name" | "slug" | "isActive">[];
};

export function decimalToNumber(value: Prisma.Decimal): number {
  return Number(value.toString());
}

export function toDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(2));
}

export function toCategorySummaryDto(
  category: Pick<Category, "id" | "name" | "slug"> & {
    parent?:
      | (Pick<Category, "id" | "name" | "slug"> & {
          parent?: Pick<Category, "id" | "name" | "slug"> | null;
        })
      | null;
  },
): CategorySummaryDto {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    parent: category.parent
      ? toCategorySummaryDto(category.parent)
      : null,
  };
}

type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  children?: CategoryNode[];
};

export function toCategoryChildDto(node: CategoryNode): CategoryChildDto {
  return {
    id: node.id,
    name: node.name,
    slug: node.slug,
    isActive: node.isActive,
    children: (node.children ?? []).map(toCategoryChildDto),
  };
}

export function toProductSummaryDto(
  product: Pick<Product, "id" | "name" | "slug" | "isActive">,
): ProductSummaryDto {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    isActive: product.isActive,
  };
}

export function toProductDto(product: ProductWithCategory): ProductDto {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: decimalToNumber(product.price),
    oldPrice: product.oldPrice ? decimalToNumber(product.oldPrice) : null,
    discount: product.discount,
    stock: product.stock,
    subcategory: product.subcategory,
    images: product.images,
    colors: product.colors,
    sizes: product.sizes,
    rating: decimalToNumber(product.rating),
    reviewCount: product.reviewCount,
    isPopular: product.isPopular,
    isNew: product.isNew,
    isActive: product.isActive,
    badge: product.badge,
    perfumeDetails: product.perfumeDetails,
    categoryId: product.categoryId,
    category: toCategorySummaryDto(product.category),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function toCategoryDto(
  category: Category & {
    parent?: Pick<Category, "id" | "name" | "slug"> | null;
    children?: CategoryNode[];
  },
): CategoryDto {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    isActive: category.isActive,
    parentId: category.parentId,
    parentSlug: category.parent?.slug ?? null,
    children: (category.children ?? []).map(toCategoryChildDto),
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export function toCategoryDetailDto(
  category: CategoryWithProducts,
): CategoryDetailDto {
  return {
    ...toCategoryDto(category),
    products: category.products.map(toProductSummaryDto),
  };
}
