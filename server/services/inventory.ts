import {
  InventoryMovementType,
  Prisma,
  type PrismaClient,
} from "@prisma/client";

import { badRequest, conflict, notFound } from "@/server/api/errors";
import { getPrisma } from "@/server/db/prisma";
import {
  hasField,
  optionalString,
  parseQueryBoolean,
  parseQueryPositiveInt,
  parseQueryString,
  requireId,
  requireNonNegativeInt,
} from "@/server/utils/validation";
import type {
  AdminInventoryItemDto,
  InventoryMovementDto,
  PaginatedDto,
  StockStatusDto,
} from "@/types/api";

type InventoryDb = Prisma.TransactionClient | PrismaClient;

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;
const MAX_REASON_LENGTH = 200;

const STOCK_STATUSES: StockStatusDto[] = [
  "IN_STOCK",
  "LOW_STOCK",
  "OUT_OF_STOCK",
];

export type AdminInventoryListInput = {
  page: number;
  limit: number;
  search?: string;
  lowStock: boolean;
  stockStatus?: StockStatusDto;
};

export type AdminInventoryPatchInput = {
  stock?: number;
  lowStockThreshold?: number;
  reason?: string;
};

function isUniqueMovementError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function escapeIlike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

function isStockStatus(value: string): value is StockStatusDto {
  return (STOCK_STATUSES as string[]).includes(value);
}

export function stockStatus(
  stock: number,
  lowStockThreshold: number,
): StockStatusDto {
  if (stock <= 0) {
    return "OUT_OF_STOCK";
  }
  if (stock <= lowStockThreshold) {
    return "LOW_STOCK";
  }
  return "IN_STOCK";
}

function toInventoryItemDto(product: {
  id: string;
  name: string;
  slug: string;
  stock: number;
  lowStockThreshold: number;
  updatedAt: Date;
}): AdminInventoryItemDto {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    stockStatus: stockStatus(product.stock, product.lowStockThreshold),
    updatedAt: product.updatedAt.toISOString(),
  };
}

function toMovementDto(row: {
  id: string;
  productId: string;
  quantity: number;
  type: InventoryMovementType;
  reason: string;
  referenceId: string | null;
  createdAt: Date;
}): InventoryMovementDto {
  return {
    id: row.id,
    productId: row.productId,
    quantity: row.quantity,
    type: row.type,
    reason: row.reason,
    referenceId: row.referenceId,
    createdAt: row.createdAt.toISOString(),
  };
}

async function recordMovement(
  db: InventoryDb,
  data: {
    productId: string;
    quantity: number;
    type: InventoryMovementType;
    reason: string;
    referenceId?: string | null;
  },
): Promise<void> {
  if (data.quantity === 0) {
    return;
  }

  await db.inventoryMovement.create({
    data: {
      productId: data.productId,
      quantity: data.quantity,
      type: data.type,
      reason: data.reason,
      referenceId: data.referenceId ?? null,
    },
  });
}

export async function decrementStockForSale(
  db: InventoryDb,
  input: { productId: string; quantity: number; orderId: string },
): Promise<void> {
  const updated = await db.product.updateMany({
    where: {
      id: input.productId,
      isActive: true,
      stock: { gte: input.quantity },
    },
    data: { stock: { decrement: input.quantity } },
  });

  if (updated.count !== 1) {
    conflict("Insufficient stock");
  }

  await recordMovement(db, {
    productId: input.productId,
    quantity: -input.quantity,
    type: InventoryMovementType.SALE,
    reason: "order",
    referenceId: input.orderId,
  });
}

export async function restoreStockForCancelledOrder(
  db: InventoryDb,
  order: {
    id: string;
    items: { productId: string; quantity: number }[];
  },
): Promise<void> {
  for (const item of order.items) {
    const sale = await db.inventoryMovement.findFirst({
      where: {
        productId: item.productId,
        type: InventoryMovementType.SALE,
        referenceId: order.id,
      },
    });
    if (!sale) {
      continue;
    }

    try {
      await recordMovement(db, {
        productId: item.productId,
        quantity: item.quantity,
        type: InventoryMovementType.CANCELLATION,
        reason: "order_cancelled",
        referenceId: order.id,
      });
    } catch (error) {
      if (isUniqueMovementError(error)) {
        continue;
      }
      throw error;
    }

    await db.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
  }
}

export async function applyAbsoluteStock(
  db: InventoryDb,
  productId: string,
  nextStock: number,
  reason: string,
): Promise<void> {
  if (!Number.isInteger(nextStock) || nextStock < 0) {
    badRequest("stock must be a non-negative integer");
  }

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { id: true, stock: true },
  });
  if (!product) {
    notFound("Product not found");
  }

  const delta = nextStock - product.stock;
  if (delta === 0) {
    return;
  }

  await db.product.update({
    where: { id: product.id },
    data: { stock: nextStock },
  });

  await recordMovement(db, {
    productId: product.id,
    quantity: delta,
    type:
      delta > 0
        ? InventoryMovementType.RESTOCK
        : InventoryMovementType.ADJUSTMENT,
    reason:
      reason || (delta > 0 ? "admin_restock" : "admin_adjustment"),
  });
}

export async function recordInitialStock(
  db: InventoryDb,
  productId: string,
  stock: number,
): Promise<void> {
  if (stock <= 0) {
    return;
  }

  await recordMovement(db, {
    productId,
    quantity: stock,
    type: InventoryMovementType.RESTOCK,
    reason: "product_created",
  });
}

export function readAdminInventoryListQuery(
  params: URLSearchParams,
): AdminInventoryListInput {
  const limit = Math.min(
    parseQueryPositiveInt(params.get("limit"), "limit", DEFAULT_LIMIT),
    MAX_LIMIT,
  );
  const statusRaw = parseQueryString(params.get("stockStatus"));
  let stockStatusFilter: StockStatusDto | undefined;
  if (statusRaw) {
    if (!isStockStatus(statusRaw)) {
      badRequest("stockStatus is invalid");
    }
    stockStatusFilter = statusRaw;
  }

  return {
    page: parseQueryPositiveInt(params.get("page"), "page", 1),
    limit,
    search: parseQueryString(params.get("search")),
    lowStock: parseQueryBoolean(params.get("lowStock"), "lowStock", false),
    stockStatus: stockStatusFilter,
  };
}

export function parseAdminInventoryPatch(
  body: Record<string, unknown>,
): AdminInventoryPatchInput {
  const patch: AdminInventoryPatchInput = {};

  if (hasField(body, "stock")) {
    patch.stock = requireNonNegativeInt(body, "stock");
  }
  if (hasField(body, "lowStockThreshold")) {
    patch.lowStockThreshold = requireNonNegativeInt(body, "lowStockThreshold");
  }
  if (hasField(body, "reason")) {
    const reason = optionalString(body, "reason") ?? "";
    if (reason.length > MAX_REASON_LENGTH) {
      badRequest("reason is too long");
    }
    patch.reason = reason;
  }

  if (
    patch.stock === undefined &&
    patch.lowStockThreshold === undefined
  ) {
    badRequest("No fields to update");
  }

  return patch;
}

function resolvedStockStatus(
  input: AdminInventoryListInput,
): StockStatusDto | undefined {
  if (input.stockStatus) {
    return input.stockStatus;
  }
  if (input.lowStock) {
    return "LOW_STOCK";
  }
  return undefined;
}

function searchSql(search: string | undefined): Prisma.Sql {
  if (!search) {
    return Prisma.empty;
  }
  const pattern = `%${escapeIlike(search)}%`;
  return Prisma.sql`AND (name ILIKE ${pattern} ESCAPE '\\' OR slug ILIKE ${pattern} ESCAPE '\\')`;
}

function statusSql(status: StockStatusDto | undefined): Prisma.Sql {
  if (status === "LOW_STOCK") {
    return Prisma.sql`AND stock > 0 AND stock <= "lowStockThreshold"`;
  }
  if (status === "OUT_OF_STOCK") {
    return Prisma.sql`AND stock = 0`;
  }
  if (status === "IN_STOCK") {
    return Prisma.sql`AND stock > "lowStockThreshold"`;
  }
  return Prisma.empty;
}

export async function listAdminInventory(
  input: AdminInventoryListInput,
): Promise<PaginatedDto<AdminInventoryItemDto>> {
  const prisma = getPrisma();
  const status = resolvedStockStatus(input);
  const skip = (input.page - 1) * input.limit;
  const whereSql = Prisma.sql`
    WHERE 1=1
    ${statusSql(status)}
    ${searchSql(input.search)}
  `;

  const [countRows, rows] = await prisma.$transaction([
    prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "Product"
      ${whereSql}
    `),
    prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        slug: string;
        stock: number;
        lowStockThreshold: number;
        updatedAt: Date;
      }>
    >(Prisma.sql`
      SELECT id, name, slug, stock, "lowStockThreshold", "updatedAt"
      FROM "Product"
      ${whereSql}
      ORDER BY "updatedAt" DESC, id DESC
      LIMIT ${input.limit} OFFSET ${skip}
    `),
  ]);

  const total = countRows[0]?.count ?? 0;

  return {
    items: rows.map(toInventoryItemDto),
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / input.limit),
    },
  };
}

export async function getAdminInventory(
  productId: string,
): Promise<AdminInventoryItemDto> {
  const product = await getPrisma().product.findUnique({
    where: { id: requireId(productId) },
    select: {
      id: true,
      name: true,
      slug: true,
      stock: true,
      lowStockThreshold: true,
      updatedAt: true,
    },
  });

  if (!product) {
    notFound("Product not found");
  }

  return toInventoryItemDto(product);
}

export async function updateAdminInventory(
  productId: string,
  input: AdminInventoryPatchInput,
): Promise<AdminInventoryItemDto> {
  const id = requireId(productId);

  return getPrisma().$transaction(async (tx) => {
    const existing = await tx.product.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      notFound("Product not found");
    }

    if (input.lowStockThreshold !== undefined) {
      await tx.product.update({
        where: { id },
        data: { lowStockThreshold: input.lowStockThreshold },
      });
    }

    if (input.stock !== undefined) {
      await applyAbsoluteStock(
        tx,
        id,
        input.stock,
        input.reason ?? "",
      );
    }

    const product = await tx.product.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        stock: true,
        lowStockThreshold: true,
        updatedAt: true,
      },
    });

    return toInventoryItemDto(product);
  });
}

export async function listAdminInventoryMovements(
  productId: string,
  page: number,
  limit: number,
): Promise<PaginatedDto<InventoryMovementDto>> {
  const id = requireId(productId);
  const take = Math.min(limit, MAX_LIMIT);
  const prisma = getPrisma();

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!product) {
    notFound("Product not found");
  }

  const skip = (page - 1) * take;
  const [total, rows] = await prisma.$transaction([
    prisma.inventoryMovement.count({ where: { productId: id } }),
    prisma.inventoryMovement.findMany({
      where: { productId: id },
      skip,
      take,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }),
  ]);

  return {
    items: rows.map(toMovementDto),
    pagination: {
      page,
      limit: take,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / take),
    },
  };
}

export function readMovementListQuery(params: URLSearchParams): {
  page: number;
  limit: number;
} {
  return {
    page: parseQueryPositiveInt(params.get("page"), "page", 1),
    limit: Math.min(
      parseQueryPositiveInt(params.get("limit"), "limit", DEFAULT_LIMIT),
      MAX_LIMIT,
    ),
  };
}
