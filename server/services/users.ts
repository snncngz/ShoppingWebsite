import { Prisma, UserRole } from "@prisma/client";

import { badRequest, conflict, forbidden, notFound } from "@/server/api/errors";
import { getPrisma } from "@/server/db/prisma";
import {
  parseQueryPositiveInt,
  parseQueryString,
  requireId,
} from "@/server/utils/validation";
import type { AdminUserDetailDto, AdminUserListItemDto, PaginatedDto } from "@/types/api";
import type { UserRole as UserRoleDto } from "@/types/auth";

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

export type AdminUserListInput = {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
};

export async function purgeUserById(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<void> {
  const orders = await tx.order.findMany({
    where: { userId },
    select: { id: true },
  });
  const orderIds = orders.map((order) => order.id);

  if (orderIds.length > 0) {
    const payments = await tx.payment.findMany({
      where: { orderId: { in: orderIds } },
      select: { id: true },
    });
    const paymentIds = payments.map((payment) => payment.id);

    if (paymentIds.length > 0) {
      await tx.paymentEvent.deleteMany({
        where: { paymentId: { in: paymentIds } },
      });
      await tx.payment.deleteMany({ where: { id: { in: paymentIds } } });
    }

    await tx.inventoryMovement.deleteMany({
      where: { referenceId: { in: orderIds } },
    });
    await tx.order.deleteMany({ where: { id: { in: orderIds } } });
  }

  await tx.user.delete({ where: { id: userId } });
}

export async function assertNotLastAdmin(role: UserRole): Promise<void> {
  if (role !== "ADMIN") {
    return;
  }

  const adminCount = await getPrisma().user.count({ where: { role: "ADMIN" } });
  if (adminCount <= 1) {
    conflict("Cannot delete the last admin account");
  }
}

export function readAdminUserListQuery(
  searchParams: URLSearchParams,
): AdminUserListInput {
  const roleRaw = searchParams.get("role")?.trim().toUpperCase();
  let role: UserRole | undefined;
  if (roleRaw === "USER" || roleRaw === "ADMIN") {
    role = roleRaw;
  } else if (roleRaw && roleRaw !== "ALL") {
    badRequest("role is invalid");
  }

  return {
    page: parseQueryPositiveInt(searchParams.get("page"), "page", 1),
    limit: parseQueryPositiveInt(
      searchParams.get("limit"),
      "limit",
      DEFAULT_LIMIT,
      MAX_LIMIT,
    ),
    search: parseQueryString(searchParams.get("search"), 120),
    role,
  };
}

export async function listAdminUsers(
  input: AdminUserListInput,
  actorId: string,
): Promise<PaginatedDto<AdminUserListItemDto>> {
  const where: Prisma.UserWhereInput = {};
  if (input.role) {
    where.role = input.role;
  }
  if (input.search) {
    where.OR = [
      { name: { contains: input.search, mode: "insensitive" } },
      { email: { contains: input.search, mode: "insensitive" } },
    ];
  }

  const skip = (input.page - 1) * input.limit;
  const [total, rows, adminCount] = await getPrisma().$transaction([
    getPrisma().user.count({ where }),
    getPrisma().user.findMany({
      where,
      skip,
      take: input.limit,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerifiedAt: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
    getPrisma().user.count({ where: { role: "ADMIN" } }),
  ]);

  return {
    items: rows.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRoleDto,
      emailVerified: Boolean(user.emailVerifiedAt),
      orderCount: user._count.orders,
      createdAt: user.createdAt.toISOString(),
      canDelete:
        user.id !== actorId && !(user.role === "ADMIN" && adminCount <= 1),
    })),
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / input.limit)),
    },
  };
}

export async function adminDeleteUser(
  id: string,
  actorId: string,
): Promise<{ id: string }> {
  const userId = requireId(id);
  if (userId === actorId) {
    forbidden("Cannot delete your own account from the admin panel");
  }

  const row = await getPrisma().user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!row) {
    notFound("User not found");
  }

  await assertNotLastAdmin(row.role);
  await getPrisma().$transaction((tx) => purgeUserById(tx, row.id));
  return { id: row.id };
}

export async function getAdminUser(
  id: string,
  actorId: string,
): Promise<AdminUserDetailDto> {
  const userId = requireId(id);
  const [row, adminCount] = await getPrisma().$transaction([
    getPrisma().user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerifiedAt: true,
        phone: true,
        addressTitle: true,
        addressLine: true,
        addressCity: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { orders: true } },
      },
    }),
    getPrisma().user.count({ where: { role: "ADMIN" } }),
  ]);

  if (!row) {
    notFound("User not found");
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as UserRoleDto,
    emailVerified: Boolean(row.emailVerifiedAt),
    orderCount: row._count.orders,
    createdAt: row.createdAt.toISOString(),
    canDelete: row.id !== actorId && !(row.role === "ADMIN" && adminCount <= 1),
    phone: row.phone,
    addressTitle: row.addressTitle,
    addressLine: row.addressLine,
    addressCity: row.addressCity,
    updatedAt: row.updatedAt.toISOString(),
  };
}
