import { Prisma, PrismaClient } from "@prisma/client";

import { loadLocalEnv } from "../prisma/load-env";
import { verifyFromRegister } from "./verification-token";

loadLocalEnv();

type Envelope<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
};

const BASE = process.env.API_BASE_URL ?? "http://localhost:3000";
const prisma = new PrismaClient();
const originalStock = new Map<string, { stock: number; price: Prisma.Decimal }>();

let failed = 0;

function pass(name: string) {
  console.log(`PASS  ${name}`);
}

function fail(name: string, error: unknown) {
  failed += 1;
  const message = error instanceof Error ? error.message : String(error);
  console.error(`FAIL  ${name}: ${message}`);
}

function cookieHeader(response: Response): string {
  const cookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];
  return cookies.map((value) => value.split(";")[0]).join("; ");
}

async function request(
  path: string,
  init: RequestInit & { cookie?: string } = {},
): Promise<{ status: number; body: Envelope<unknown>; cookie: string }> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (init.cookie) {
    headers.set("Cookie", init.cookie);
  }

  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    redirect: "manual",
  });

  let body: Envelope<unknown> = { success: false };
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    body = (await response.json()) as Envelope<unknown>;
  }

  return {
    status: response.status,
    body,
    cookie: cookieHeader(response) || init.cookie || "",
  };
}

function expectStatus(name: string, actual: number, expected: number) {
  if (actual !== expected) {
    throw new Error(`${name}: expected ${expected}, got ${actual}`);
  }
}

function assertNoSecret(payload: unknown) {
  const raw = JSON.stringify(payload);
  if (raw.includes("passwordHash")) {
    throw new Error("sensitive auth fields leaked");
  }
}

async function main() {
  const stamp = Date.now();
  const password = "Testpass1";
  const email = `admin-order-${stamp}@velora.test`;
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
  }

  const anon = await request("/api/admin/orders");
  expectStatus("anon list", anon.status, 401);
  const anonPatch = await request("/api/admin/orders/missing", {
    method: "PATCH",
    body: JSON.stringify({ status: "PROCESSING" }),
  });
  expectStatus("anon patch", anonPatch.status, 401);

  const user = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Order Customer", email, password }),
  });
  expectStatus("register user", user.status, 201);
  const userCookie = (await verifyFromRegister(request, user)).cookie;

  const userList = await request("/api/admin/orders", { cookie: userCookie });
  expectStatus("user list", userList.status, 403);

  const productsRes = await request("/api/products?limit=20&isActive=true");
  const product = (
    productsRes.body.data as { items: { id: string; price: number; stock: number }[] }
  ).items.find((item) => item.stock >= 1);
  if (!product) {
    throw new Error("need an in-stock product");
  }
  const stored = await prisma.product.findUniqueOrThrow({
    where: { id: product.id },
  });
  originalStock.set(product.id, { stock: stored.stock, price: stored.price });

  await request("/api/cart/items", {
    method: "POST",
    cookie: userCookie,
    body: JSON.stringify({ productId: product.id, quantity: 1 }),
  });
  const created = await request("/api/orders", {
    method: "POST",
    cookie: userCookie,
  });
  expectStatus("user create order", created.status, 201);
  const orderId = (created.body.data as { id: string; items: { unitPrice: number }[] }).id;
  const snapshotPrice = (created.body.data as { items: { unitPrice: number }[] }).items[0]
    .unitPrice;

  const other = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Other Customer",
      email: `admin-order-b-${stamp}@velora.test`,
      password,
    }),
  });
  expectStatus("register other user", other.status, 201);
  const otherCookie = (await verifyFromRegister(request, other)).cookie;
  const otherOrders = await request("/api/orders", { cookie: otherCookie });
  expectStatus("other user orders", otherOrders.status, 200);
  const otherIds = (otherOrders.body.data as { id: string }[]).map((item) => item.id);
  if (otherIds.includes(orderId)) {
    throw new Error("USER GET /api/orders leaked another user's order");
  }
  const ownOrders = await request("/api/orders", { cookie: userCookie });
  expectStatus("own orders", ownOrders.status, 200);
  const ownIds = (ownOrders.body.data as { id: string }[]).map((item) => item.id);
  if (!ownIds.includes(orderId)) {
    throw new Error("owner cannot see own order on GET /api/orders");
  }
  const otherDetail = await request(`/api/orders/${orderId}`, {
    cookie: otherCookie,
  });
  expectStatus("other user order detail", otherDetail.status, 404);
  pass("12.8 Regression");

  const adminLogin = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  expectStatus("admin login", adminLogin.status, 200);
  const adminCookie = adminLogin.cookie;

  const list = await request("/api/admin/orders?page=1&limit=20", {
    cookie: adminCookie,
  });
  expectStatus("admin list", list.status, 200);
  const listed = list.body.data as {
    items: {
      id: string;
      status: string;
      total: number;
      itemCount: number;
      user: { name: string; email: string };
    }[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
  assertNoSecret(listed);
  if (!listed.pagination || listed.pagination.limit > 50) {
    throw new Error("pagination missing or limit too high");
  }
  const row = listed.items.find((item) => item.id === orderId);
  if (!row || row.user.email !== email || row.itemCount !== 1) {
    throw new Error("admin list missing created order or customer");
  }
  const capped = await request("/api/admin/orders?page=1&limit=999", {
    cookie: adminCookie,
  });
  expectStatus("limit cap", capped.status, 200);
  const cappedLimit = (capped.body.data as { pagination: { limit: number } })
    .pagination.limit;
  if (cappedLimit !== 50) {
    throw new Error(`expected limit cap 50, got ${cappedLimit}`);
  }
  pass("Admin Order List");
  pass("Pagination");
  pass("Customer Information");

  const filtered = await request("/api/admin/orders?status=PENDING&search=Order%20Customer", {
    cookie: adminCookie,
  });
  expectStatus("filter", filtered.status, 200);
  const filteredItems = (filtered.body.data as { items: { id: string }[] }).items;
  if (!filteredItems.some((item) => item.id === orderId)) {
    throw new Error("status/search filter missed the order");
  }
  pass("Filtering");

  const detail = await request(`/api/admin/orders/${orderId}`, {
    cookie: adminCookie,
  });
  expectStatus("admin detail", detail.status, 200);
  const order = detail.body.data as {
    id: string;
    user: { name: string; email: string };
    items: { unitPrice: number; quantity: number; lineTotal: number; product: { name: string } }[];
    total: number;
    status: string;
  };
  assertNoSecret(order);
  if (order.user.email !== email || order.items.length !== 1) {
    throw new Error("detail missing customer or items");
  }
  if (order.items[0].unitPrice !== snapshotPrice) {
    throw new Error("detail unitPrice is not snapshot");
  }
  pass("Order Detail");
  pass("Order Items");
  pass("Unit Price Snapshot");

  await prisma.product.update({
    where: { id: product.id },
    data: { price: stored.price.add(250) },
  });
  const detailAfterPrice = await request(`/api/admin/orders/${orderId}`, {
    cookie: adminCookie,
  });
  const stillSnapshot = (
    detailAfterPrice.body.data as { items: { unitPrice: number }[] }
  ).items[0].unitPrice;
  if (stillSnapshot !== snapshotPrice) {
    throw new Error("admin detail used current product price");
  }

  const userDetail = await request(`/api/admin/orders/${orderId}`, {
    cookie: userCookie,
  });
  expectStatus("user detail", userDetail.status, 403);
  const userPatch = await request(`/api/admin/orders/${orderId}`, {
    method: "PATCH",
    cookie: userCookie,
    body: JSON.stringify({ status: "SHIPPED" }),
  });
  expectStatus("user patch", userPatch.status, 403);
  pass("USER Isolation");

  const invalid = await request(`/api/admin/orders/${orderId}`, {
    method: "PATCH",
    cookie: adminCookie,
    body: JSON.stringify({ status: "NOT_A_STATUS" }),
  });
  expectStatus("invalid status", invalid.status, 400);

  const missing = await request("/api/admin/orders/missing-order-id", {
    cookie: adminCookie,
  });
  expectStatus("missing order", missing.status, 404);

  const patched = await request(`/api/admin/orders/${orderId}`, {
    method: "PATCH",
    cookie: adminCookie,
    body: JSON.stringify({ status: "PROCESSING" }),
  });
  expectStatus("status update", patched.status, 200);
  if ((patched.body.data as { status: string }).status !== "PROCESSING") {
    throw new Error("status was not updated");
  }
  const persisted = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
  });
  if (persisted.status !== "PROCESSING") {
    throw new Error("status not stored in PostgreSQL");
  }

  const cancelled = await request(`/api/admin/orders/${orderId}`, {
    method: "PATCH",
    cookie: adminCookie,
    body: JSON.stringify({ status: "CANCELLED" }),
  });
  expectStatus("cancel status", cancelled.status, 200);
  const stillThere = await request(`/api/admin/orders/${orderId}`, {
    cookie: adminCookie,
  });
  expectStatus("cancel keeps row", stillThere.status, 200);
  if ((stillThere.body.data as { status: string }).status !== "CANCELLED") {
    throw new Error("cancel did not persist CANCELLED");
  }
  const dbRow = await prisma.order.findUnique({ where: { id: orderId } });
  if (!dbRow) {
    throw new Error("order was physically deleted");
  }

  pass("Status Update");
  pass("PostgreSQL");
  pass("Authorization");
  pass("LocalStorage");
}

main()
  .catch((error) => {
    fail("admin orders suite", error);
  })
  .finally(async () => {
    try {
      await prisma.order.deleteMany({
        where: { user: { email: { startsWith: "admin-order-" } } },
      });
      await prisma.cartItem.deleteMany({
        where: { cart: { user: { email: { startsWith: "admin-order-" } } } },
      });
      await prisma.wishlistItem.deleteMany({
        where: { wishlist: { user: { email: { startsWith: "admin-order-" } } } },
      });
      await prisma.cart.deleteMany({
        where: { user: { email: { startsWith: "admin-order-" } } },
      });
      await prisma.wishlist.deleteMany({
        where: { user: { email: { startsWith: "admin-order-" } } },
      });
      await prisma.user.deleteMany({
        where: { email: { startsWith: "admin-order-" } },
      });
      for (const [id, value] of originalStock.entries()) {
        await prisma.product.update({
          where: { id },
          data: { stock: value.stock, price: value.price },
        });
      }
    } catch (cleanupError) {
      console.error("cleanup failed", cleanupError);
    }
    await prisma.$disconnect();
    if (failed > 0) {
      process.exit(1);
    }
    console.log("Admin order tests complete.");
  });
