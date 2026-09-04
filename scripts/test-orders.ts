import { Prisma, PrismaClient } from "@prisma/client";

import { loadLocalEnv } from "../prisma/load-env";
import { verifyFromRegister } from "./verification-token";

loadLocalEnv();

type Envelope<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
};

type ProductRow = {
  id: string;
  price: number;
  stock: number;
};

type OrderPayload = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: {
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
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

async function main() {
  const stamp = Date.now();
  const password = "Testpass1";
  const emailA = `order-a-${stamp}@velora.test`;
  const emailB = `order-b-${stamp}@velora.test`;
  let userAId = "";
  let productA: ProductRow | undefined;
  let productB: ProductRow | undefined;

  const anon = await request("/api/orders", { method: "POST" });
  expectStatus("anon create", anon.status, 401);
  pass("Authentication");

  const productsRes = await request("/api/products?limit=20&isActive=true");
  expectStatus("product list", productsRes.status, 200);
  const products = (
    productsRes.body.data as {
      items: ProductRow[];
    }
  ).items.filter((product) => product.stock >= 2);
  if (products.length < 2) {
    throw new Error("need at least two in-stock products");
  }
  productA = products[0];
  productB = products[1];

  const storedA = await prisma.product.findUniqueOrThrow({
    where: { id: productA.id },
  });
  const storedB = await prisma.product.findUniqueOrThrow({
    where: { id: productB.id },
  });
  originalStock.set(productA.id, { stock: storedA.stock, price: storedA.price });
  originalStock.set(productB.id, { stock: storedB.stock, price: storedB.price });

  const userA = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Order A", email: emailA, password }),
  });
  expectStatus("register A", userA.status, 201);
  const verifiedA = await verifyFromRegister(request, userA);
  userAId = (verifiedA.body.data as { id: string }).id;
  const cookieA = verifiedA.cookie;

  const userB = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Order B", email: emailB, password }),
  });
  expectStatus("register B", userB.status, 201);
  const cookieB = (await verifyFromRegister(request, userB)).cookie;

  const empty = await request("/api/orders", { method: "POST", cookie: cookieA });
  expectStatus("empty cart", empty.status, 400);
  pass("Empty cart rejected");

  await request("/api/cart/items", {
    method: "POST",
    cookie: cookieA,
    body: JSON.stringify({ productId: productA.id, quantity: 2 }),
  });

  const created = await request("/api/orders", {
    method: "POST",
    cookie: cookieA,
  });
  expectStatus("create order", created.status, 201);
  const order = created.body.data as OrderPayload;
  if (order.status !== "PENDING" || order.items.length !== 1) {
    throw new Error("order create payload invalid");
  }
  pass("Order Create");
  pass("Order Items");

  const expectedUnit = productA.price;
  const expectedTotal = Number((expectedUnit * 2).toFixed(2));
  if (order.items[0].unitPrice !== expectedUnit) {
    throw new Error(
      `unitPrice ${order.items[0].unitPrice} !== ${expectedUnit}`,
    );
  }
  if (order.total !== expectedTotal) {
    throw new Error(`total ${order.total} !== ${expectedTotal}`);
  }
  pass("Order Total");
  pass("Unit Price Snapshot");

  const cartAfter = await request("/api/cart", { cookie: cookieA });
  if ((cartAfter.body.data as { items: unknown[] }).items.length !== 0) {
    throw new Error("cart was not cleared after order");
  }
  pass("Cart Clear");

  const stockAfter = await prisma.product.findUniqueOrThrow({
    where: { id: productA.id },
  });
  if (stockAfter.stock !== storedA.stock - 2) {
    throw new Error(
      `stock ${stockAfter.stock} !== ${storedA.stock - 2}`,
    );
  }
  pass("Stock Decrement");

  await prisma.product.update({
    where: { id: productA.id },
    data: { price: storedA.price.add(500) },
  });
  const detail = await request(`/api/orders/${order.id}`, { cookie: cookieA });
  expectStatus("own detail", detail.status, 200);
  const detailOrder = detail.body.data as OrderPayload;
  if (detailOrder.items[0].unitPrice !== expectedUnit) {
    throw new Error("unitPrice snapshot was overwritten");
  }
  pass("Order Detail");

  const list = await request("/api/orders", { cookie: cookieA });
  expectStatus("list", list.status, 200);
  const listed = list.body.data as OrderPayload[];
  if (!listed.some((entry) => entry.id === order.id)) {
    throw new Error("own order missing from list");
  }
  pass("Get Orders");

  const stolen = await request(`/api/orders/${order.id}`, { cookie: cookieB });
  expectStatus("other user order", stolen.status, 404);
  pass("Ownership Security");

  await request("/api/cart/items", {
    method: "POST",
    cookie: cookieA,
    body: JSON.stringify({ productId: productA.id, quantity: 1 }),
  });
  await request("/api/cart/items", {
    method: "POST",
    cookie: cookieA,
    body: JSON.stringify({ productId: productB.id, quantity: 1 }),
  });
  const stockABeforeFail = await prisma.product.findUniqueOrThrow({
    where: { id: productA.id },
  });
  await prisma.product.update({
    where: { id: productB.id },
    data: { stock: 0 },
  });
  const failedOrder = await request("/api/orders", {
    method: "POST",
    cookie: cookieA,
  });
  expectStatus("insufficient stock", failedOrder.status, 409);
  pass("Stock Check");

  const stockAAfterFail = await prisma.product.findUniqueOrThrow({
    where: { id: productA.id },
  });
  if (stockAAfterFail.stock !== stockABeforeFail.stock) {
    throw new Error("failed order decremented stock");
  }
  const cartUnchanged = await request("/api/cart", { cookie: cookieA });
  const remaining = (cartUnchanged.body.data as { items: { productId: string }[] })
    .items;
  if (remaining.length !== 2) {
    throw new Error("failed order cleared cart");
  }
  const extraOrder = await prisma.order.count({
    where: { userId: userAId, id: { not: order.id } },
  });
  if (extraOrder !== 0) {
    throw new Error("failed order created a row");
  }
  pass("Transaction");

  const persisted = await prisma.order.findUnique({
    where: { id: order.id },
    include: { items: true },
  });
  if (!persisted || persisted.items.length !== 1) {
    throw new Error("order missing from PostgreSQL");
  }
  pass("PostgreSQL");

  const cartApi = await request("/api/cart", { cookie: cookieA });
  expectStatus("cart still works", cartApi.status, 200);
  const wishApi = await request("/api/wishlist", { cookie: cookieA });
  expectStatus("wishlist still works", wishApi.status, 200);
  const health = await request("/api/health");
  expectStatus("health", health.status, 200);
  pass("Regression");
}

main()
  .catch((error) => {
    fail("order suite", error);
  })
  .finally(async () => {
    try {
      await prisma.order.deleteMany({
        where: { user: { email: { startsWith: "order-" } } },
      });
      await prisma.cartItem.deleteMany({
        where: { cart: { user: { email: { startsWith: "order-" } } } },
      });
      await prisma.wishlistItem.deleteMany({
        where: { wishlist: { user: { email: { startsWith: "order-" } } } },
      });
      await prisma.cart.deleteMany({
        where: { user: { email: { startsWith: "order-" } } },
      });
      await prisma.wishlist.deleteMany({
        where: { user: { email: { startsWith: "order-" } } },
      });
      await prisma.user.deleteMany({
        where: { email: { startsWith: "order-" } },
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
    console.log("Order tests complete.");
  });
