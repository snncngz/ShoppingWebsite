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

let failed = 0;
let productId = "";
const userEmails: string[] = [];

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

async function registerUser(name: string, email: string, password: string) {
  const registered = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  expectStatus(`register ${email}`, registered.status, 201);
  userEmails.push(email);
  return (await verifyFromRegister(request, registered)).cookie;
}

async function main() {
  const stamp = Date.now();
  const password = "Testpass1";
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
  }

  const anon = await request("/api/admin/inventory");
  expectStatus("anon list", anon.status, 401);
  const anonPatch = await request("/api/admin/inventory/missing", {
    method: "PATCH",
    body: JSON.stringify({ stock: 1 }),
  });
  expectStatus("anon patch", anonPatch.status, 401);

  const userCookie = await registerUser(
    "Inventory User",
    `inv-user-${stamp}@velora.test`,
    password,
  );
  const userList = await request("/api/admin/inventory", { cookie: userCookie });
  expectStatus("user list", userList.status, 403);
  pass("Authorization");

  const adminLogin = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  expectStatus("admin login", adminLogin.status, 200);
  const adminCookie = adminLogin.cookie;

  const category = await prisma.category.findFirst({
    where: { isActive: true },
  });
  if (!category) {
    throw new Error("need a category");
  }

  const createdProduct = await prisma.product.create({
    data: {
      name: "Inventory Test Product",
      slug: `inv-test-${stamp}`,
      description: "inventory test",
      price: new Prisma.Decimal("100.00"),
      stock: 10,
      lowStockThreshold: 3,
      categoryId: category.id,
      images: ["/placeholders/tshirt.svg"],
      colors: ["Siyah"],
      sizes: ["M"],
      isActive: true,
    },
  });
  productId = createdProduct.id;

  const listed = await request("/api/admin/inventory?page=1&limit=20&search=inv-test-", {
    cookie: adminCookie,
  });
  expectStatus("admin list", listed.status, 200);
  const listData = listed.body.data as {
    items: { id: string; stock: number; stockStatus: string }[];
    pagination: { limit: number };
  };
  if (!listData.items.some((item) => item.id === productId)) {
    throw new Error("inventory list missing test product");
  }

  const capped = await request("/api/admin/inventory?limit=999", {
    cookie: adminCookie,
  });
  expectStatus("limit cap", capped.status, 200);
  if ((capped.body.data as { pagination: { limit: number } }).pagination.limit !== 50) {
    throw new Error("inventory limit was not capped");
  }
  pass("Inventory API");

  const restock = await request(`/api/admin/inventory/${productId}`, {
    method: "PATCH",
    cookie: adminCookie,
    body: JSON.stringify({ stock: 15, reason: "test_restock", type: "SALE" }),
  });
  expectStatus("restock", restock.status, 200);
  if ((restock.body.data as { stock: number }).stock !== 15) {
    throw new Error("restock did not set stock to 15");
  }
  const afterRestock = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
  });
  if (afterRestock.stock !== 15) {
    throw new Error("postgres stock after restock");
  }
  const productApi = await request(`/api/products/${productId}`);
  expectStatus("product api", productApi.status, 200);
  if ((productApi.body.data as { stock: number }).stock !== 15) {
    throw new Error("product API did not reflect stock");
  }

  const adjust = await request(`/api/admin/inventory/${productId}`, {
    method: "PATCH",
    cookie: adminCookie,
    body: JSON.stringify({ stock: 12, quantity: 99 }),
  });
  expectStatus("adjustment", adjust.status, 200);
  if ((adjust.body.data as { stock: number }).stock !== 12) {
    throw new Error("adjustment did not set stock to 12");
  }
  pass("Stock Update");
  pass("PostgreSQL");

  const negative = await request(`/api/admin/inventory/${productId}`, {
    method: "PATCH",
    cookie: adminCookie,
    body: JSON.stringify({ stock: -1 }),
  });
  expectStatus("negative stock", negative.status, 400);
  const decimal = await request(`/api/admin/inventory/${productId}`, {
    method: "PATCH",
    cookie: adminCookie,
    body: JSON.stringify({ stock: 1.5 }),
  });
  expectStatus("decimal stock", decimal.status, 400);

  const low = await request(`/api/admin/inventory/${productId}`, {
    method: "PATCH",
    cookie: adminCookie,
    body: JSON.stringify({ stock: 3, lowStockThreshold: 3 }),
  });
  expectStatus("low stock set", low.status, 200);
  if ((low.body.data as { stockStatus: string }).stockStatus !== "LOW_STOCK") {
    throw new Error("expected LOW_STOCK");
  }
  const lowFilter = await request(
    "/api/admin/inventory?lowStock=true&search=inv-test-",
    { cookie: adminCookie },
  );
  expectStatus("low stock filter", lowFilter.status, 200);
  const lowItems = (lowFilter.body.data as { items: { id: string }[] }).items;
  if (!lowItems.some((item) => item.id === productId)) {
    throw new Error("lowStock filter missed product");
  }
  pass("Low Stock");

  const empty = await request(`/api/admin/inventory/${productId}`, {
    method: "PATCH",
    cookie: adminCookie,
    body: JSON.stringify({ stock: 0 }),
  });
  expectStatus("out of stock set", empty.status, 200);
  if ((empty.body.data as { stockStatus: string }).stockStatus !== "OUT_OF_STOCK") {
    throw new Error("expected OUT_OF_STOCK");
  }
  pass("Out Of Stock");

  await request(`/api/admin/inventory/${productId}`, {
    method: "PATCH",
    cookie: adminCookie,
    body: JSON.stringify({ stock: 2 }),
  });

  await request("/api/cart/items", {
    method: "POST",
    cookie: userCookie,
    body: JSON.stringify({ productId, quantity: 1 }),
  });
  const created = await request("/api/orders", {
    method: "POST",
    cookie: userCookie,
  });
  expectStatus("create order", created.status, 201);
  const orderId = (created.body.data as { id: string }).id;
  const stockAfterSale = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
  });
  if (stockAfterSale.stock !== 1) {
    throw new Error(`expected stock 1 after sale, got ${stockAfterSale.stock}`);
  }
  if (stockAfterSale.stock < 0) {
    throw new Error("stock went negative");
  }
  pass("Order Stock Integration");
  pass("Atomic Decrement");

  const userB = await registerUser(
    "Inventory User B",
    `inv-user-b-${stamp}@velora.test`,
    password,
  );
  const addB = await request("/api/cart/items", {
    method: "POST",
    cookie: userB,
    body: JSON.stringify({ productId, quantity: 1 }),
  });
  expectStatus("user B cart", addB.status, 200);
  await prisma.product.update({
    where: { id: productId },
    data: { stock: 0 },
  });
  const insufficient = await request("/api/orders", {
    method: "POST",
    cookie: userB,
  });
  expectStatus("insufficient stock", insufficient.status, 409);
  const stockAfterFail = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
  });
  if (stockAfterFail.stock !== 0) {
    throw new Error("failed order changed stock");
  }
  await prisma.product.update({
    where: { id: productId },
    data: { stock: 1 },
  });

  const cancelled = await request(`/api/admin/orders/${orderId}`, {
    method: "PATCH",
    cookie: adminCookie,
    body: JSON.stringify({ status: "CANCELLED" }),
  });
  expectStatus("cancel", cancelled.status, 200);
  const stockAfterCancel = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
  });
  if (stockAfterCancel.stock !== 2) {
    throw new Error(`expected stock 2 after cancel, got ${stockAfterCancel.stock}`);
  }
  pass("Cancellation Restore");

  const cancelledAgain = await request(`/api/admin/orders/${orderId}`, {
    method: "PATCH",
    cookie: adminCookie,
    body: JSON.stringify({ status: "CANCELLED" }),
  });
  expectStatus("cancel again", cancelledAgain.status, 200);
  const stockAfterSecondCancel = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
  });
  if (stockAfterSecondCancel.stock !== 2) {
    throw new Error("double restore changed stock");
  }
  pass("Double Restore");

  const deliveredRejectSetup = await request(`/api/admin/inventory/${productId}`, {
    method: "PATCH",
    cookie: adminCookie,
    body: JSON.stringify({ stock: 1 }),
  });
  expectStatus("reset stock for delivered", deliveredRejectSetup.status, 200);
  await request("/api/cart/items", {
    method: "POST",
    cookie: userCookie,
    body: JSON.stringify({ productId, quantity: 1 }),
  });
  const shippedOrder = await request("/api/orders", {
    method: "POST",
    cookie: userCookie,
  });
  expectStatus("second order", shippedOrder.status, 201);
  const shippedId = (shippedOrder.body.data as { id: string }).id;
  await request(`/api/admin/orders/${shippedId}`, {
    method: "PATCH",
    cookie: adminCookie,
    body: JSON.stringify({ status: "PROCESSING" }),
  });
  await request(`/api/admin/orders/${shippedId}`, {
    method: "PATCH",
    cookie: adminCookie,
    body: JSON.stringify({ status: "SHIPPED" }),
  });
  const delivered = await request(`/api/admin/orders/${shippedId}`, {
    method: "PATCH",
    cookie: adminCookie,
    body: JSON.stringify({ status: "DELIVERED" }),
  });
  expectStatus("delivered", delivered.status, 200);
  const cancelDelivered = await request(`/api/admin/orders/${shippedId}`, {
    method: "PATCH",
    cookie: adminCookie,
    body: JSON.stringify({ status: "CANCELLED" }),
  });
  expectStatus("cancel delivered", cancelDelivered.status, 400);
  const stockDelivered = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
  });
  if (stockDelivered.stock !== 0) {
    throw new Error("delivered cancel restored stock");
  }

  const history = await request(
    `/api/admin/inventory/${productId}/movements?page=1&limit=20`,
    { cookie: adminCookie },
  );
  expectStatus("movements", history.status, 200);
  const types = (
    history.body.data as { items: { type: string; quantity: number }[] }
  ).items.map((item) => item.type);
  for (const required of ["RESTOCK", "ADJUSTMENT", "SALE", "CANCELLATION"]) {
    if (!types.includes(required)) {
      throw new Error(`missing movement ${required}`);
    }
  }
  const saleQty = (
    history.body.data as { items: { type: string; quantity: number }[] }
  ).items.find((item) => item.type === "SALE");
  if (!saleQty || saleQty.quantity >= 0) {
    throw new Error("SALE movement should be negative");
  }
  pass("Inventory History");

  await request(`/api/admin/inventory/${productId}`, {
    method: "PATCH",
    cookie: adminCookie,
    body: JSON.stringify({ stock: 1 }),
  });
  const userC = await registerUser(
    "Inventory User C",
    `inv-user-c-${stamp}@velora.test`,
    password,
  );
  const userD = await registerUser(
    "Inventory User D",
    `inv-user-d-${stamp}@velora.test`,
    password,
  );
  await request("/api/cart/items", {
    method: "POST",
    cookie: userC,
    body: JSON.stringify({ productId, quantity: 1 }),
  });
  await request("/api/cart/items", {
    method: "POST",
    cookie: userD,
    body: JSON.stringify({ productId, quantity: 1 }),
  });
  const [raceA, raceB] = await Promise.all([
    request("/api/orders", { method: "POST", cookie: userC }),
    request("/api/orders", { method: "POST", cookie: userD }),
  ]);
  const raceStatuses = [raceA.status, raceB.status].sort();
  if (raceStatuses[0] !== 201 || raceStatuses[1] !== 409) {
    throw new Error(`concurrency expected 201+409, got ${raceStatuses.join(",")}`);
  }
  const raceStock = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
  });
  if (raceStock.stock !== 0) {
    throw new Error(`expected final stock 0, got ${raceStock.stock}`);
  }
  if (raceStock.stock < 0) {
    throw new Error("oversell produced negative stock");
  }
  pass("Overselling Protection");
}

main()
  .catch((error) => {
    fail("inventory suite", error);
  })
  .finally(async () => {
    try {
      if (userEmails.length > 0) {
        await prisma.order.deleteMany({
          where: { user: { email: { in: userEmails } } },
        });
        await prisma.cartItem.deleteMany({
          where: { cart: { user: { email: { in: userEmails } } } },
        });
        await prisma.wishlistItem.deleteMany({
          where: { wishlist: { user: { email: { in: userEmails } } } },
        });
        await prisma.cart.deleteMany({
          where: { user: { email: { in: userEmails } } },
        });
        await prisma.wishlist.deleteMany({
          where: { user: { email: { in: userEmails } } },
        });
        await prisma.user.deleteMany({
          where: { email: { in: userEmails } },
        });
      }
      if (productId) {
        await prisma.inventoryMovement.deleteMany({
          where: { productId },
        });
        await prisma.product.delete({ where: { id: productId } });
      }
    } catch (cleanupError) {
      console.error("cleanup failed", cleanupError);
    }
    await prisma.$disconnect();
    if (failed > 0) {
      process.exit(1);
    }
    console.log("Inventory tests complete.");
  });
