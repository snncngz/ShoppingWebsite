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
const createdProductIds: string[] = [];
const originalStock = new Map<string, number>();

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
): Promise<{
  status: number;
  body: Envelope<unknown>;
  cookie: string;
  headers: Headers;
}> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type") && !headers.has("content-type")) {
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
    headers: response.headers,
  };
}

function expectStatus(name: string, actual: number, expected: number) {
  if (actual !== expected) {
    throw new Error(`${name}: expected ${expected}, got ${actual}`);
  }
}

function expectCode(name: string, body: Envelope<unknown>, code: string) {
  if (body.error?.code !== code) {
    throw new Error(`${name}: expected code ${code}, got ${body.error?.code}`);
  }
}

async function main() {
  const stamp = Date.now();
  const password = "Testpass1";
  const emailA = `sec-a-${stamp}@velora.test`;
  const emailB = `sec-b-${stamp}@velora.test`;
  const bruteEmail = `sec-brute-${stamp}@velora.test`;

  const health = await request("/api/health");
  expectStatus("health", health.status, 200);
  if (health.headers.get("x-content-type-options") !== "nosniff") {
    throw new Error("missing X-Content-Type-Options");
  }
  if (health.headers.get("x-frame-options") !== "DENY") {
    throw new Error("missing X-Frame-Options");
  }
  pass("Security Headers");

  const anonCart = await request("/api/cart");
  expectStatus("anon cart", anonCart.status, 401);
  const anonOrders = await request("/api/orders");
  expectStatus("anon orders", anonOrders.status, 401);
  const anonAdmin = await request("/api/admin/orders");
  expectStatus("anon admin orders", anonAdmin.status, 401);
  const anonUsers = await request("/api/admin/users");
  expectStatus("anon admin users", anonUsers.status, 401);
  const anonInventory = await request("/api/admin/inventory");
  expectStatus("anon inventory", anonInventory.status, 401);
  const invalidSession = await request("/api/auth/me", {
    cookie: "velora_session=not-a-valid-token",
  });
  expectStatus("invalid session", invalidSession.status, 401);
  pass("Anonymous / Invalid Session");

  const csrf = await request("/api/auth/login", {
    method: "POST",
    headers: { Origin: "https://evil.example" },
    body: JSON.stringify({ email: emailA, password }),
  });
  expectStatus("csrf origin", csrf.status, 403);
  pass("CSRF Origin");

  const massRegister = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Sec User A",
      email: emailA,
      password,
      role: "ADMIN",
      userId: "another-user",
      passwordHash: "x",
    }),
  });
  expectStatus("mass assignment register", massRegister.status, 400);
  expectCode("mass assignment register", massRegister.body, "BAD_REQUEST");

  const userA = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Sec User A", email: emailA, password }),
  });
  expectStatus("register A", userA.status, 201);
  const verifiedA = await verifyFromRegister(request, userA);
  const cookieA = verifiedA.cookie;
  const registered = verifiedA.body.data as { role?: string; passwordHash?: unknown };
  if (registered.role !== "USER" || registered.passwordHash) {
    throw new Error("register leaked privileged fields");
  }

  const userB = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Sec User B", email: emailB, password }),
  });
  expectStatus("register B", userB.status, 201);
  const verifiedB = await verifyFromRegister(request, userB);
  const cookieB = verifiedB.cookie;
  pass("Mass Assignment Register");

  const userAdmin = await request("/api/admin/orders", { cookie: cookieA });
  expectStatus("user admin orders", userAdmin.status, 403);
  const userUsers = await request("/api/admin/users", { cookie: cookieA });
  expectStatus("user admin users", userUsers.status, 403);
  const otherId = (verifiedB.body.data as { id?: string }).id;
  if (!otherId) {
    throw new Error("user B missing id");
  }
  const crossDelete = await request(`/api/admin/users/${otherId}`, {
    method: "DELETE",
    cookie: cookieA,
  });
  expectStatus("user delete other user", crossDelete.status, 403);
  const userProduct = await request("/api/products", {
    method: "POST",
    cookie: cookieA,
    body: JSON.stringify({
      name: "Hack",
      slug: `hack-${stamp}`,
      price: 1,
      stock: 999999,
      categoryId: "x",
    }),
  });
  expectStatus("user create product", userProduct.status, 403);
  const userStock = await request("/api/products/not-a-real-id", {
    method: "PATCH",
    cookie: cookieA,
    body: JSON.stringify({ stock: 999999 }),
  });
  expectStatus("user patch stock", userStock.status, 403);
  const userInventory = await request("/api/admin/inventory/not-a-real-id", {
    method: "PATCH",
    cookie: cookieA,
    body: JSON.stringify({ stock: 999999 }),
  });
  expectStatus("user patch inventory", userInventory.status, 403);
  pass("USER cannot reach admin APIs");

  const productsRes = await request("/api/products?limit=20&isActive=true");
  expectStatus("product list", productsRes.status, 200);
  const product = (
    productsRes.body.data as { items: { id: string; stock: number }[] }
  ).items.find((item) => item.stock >= 2);
  if (!product) {
    throw new Error("need an in-stock product");
  }
  const stored = await prisma.product.findUniqueOrThrow({
    where: { id: product.id },
  });
  originalStock.set(product.id, stored.stock);

  const added = await request("/api/cart/items", {
    method: "POST",
    cookie: cookieA,
    body: JSON.stringify({ productId: product.id, quantity: 1 }),
  });
  expectStatus("cart add", added.status, 200);
  const cartItemId = (
    added.body.data as { items: { id: string }[] }
  ).items[0]?.id;
  if (!cartItemId) {
    throw new Error("cart item missing");
  }

  const foreignCart = await request(`/api/cart/items/${cartItemId}`, {
    method: "PATCH",
    cookie: cookieB,
    body: JSON.stringify({ quantity: 2 }),
  });
  expectStatus("foreign cart patch", foreignCart.status, 404);
  const foreignCartDelete = await request(`/api/cart/items/${cartItemId}`, {
    method: "DELETE",
    cookie: cookieB,
  });
  expectStatus("foreign cart delete", foreignCartDelete.status, 404);

  const wish = await request("/api/wishlist/items", {
    method: "POST",
    cookie: cookieA,
    body: JSON.stringify({ productId: product.id }),
  });
  expectStatus("wishlist add", wish.status, 200);
  const wishItemId = (
    wish.body.data as { items: { id: string }[] }
  ).items[0]?.id;
  if (!wishItemId) {
    throw new Error("wishlist item missing");
  }
  const foreignWish = await request(`/api/wishlist/items/${wishItemId}`, {
    method: "DELETE",
    cookie: cookieB,
  });
  expectStatus("foreign wishlist delete", foreignWish.status, 404);

  const createdOrder = await request("/api/orders", {
    method: "POST",
    cookie: cookieA,
  });
  expectStatus("create order", createdOrder.status, 201);
  const order = createdOrder.body.data as {
    id: string;
    total: number;
    status: string;
  };
  const foreignOrder = await request(`/api/orders/${order.id}`, {
    cookie: cookieB,
  });
  expectStatus("foreign order", foreignOrder.status, 404);
  pass("Ownership");

  const fakePayment = await request("/api/payments", {
    method: "POST",
    cookie: cookieA,
    body: JSON.stringify({
      orderId: order.id,
      amount: 1,
      paymentStatus: "PAID",
      status: "SUCCEEDED",
    }),
  });
  expectStatus("payment create", fakePayment.status, 201);
  const payment = fakePayment.body.data as {
    amount: number;
    status: string;
    orderStatus: string;
  };
  if (payment.amount !== order.total) {
    throw new Error("client amount was trusted");
  }
  if (payment.status === "SUCCEEDED" || payment.orderStatus === "PAID") {
    throw new Error("client payment status was trusted");
  }

  const badWebhook = await request("/api/payments/webhook", {
    method: "POST",
    headers: { "x-payment-signature": "deadbeef" },
    body: JSON.stringify({
      eventId: `fake-${stamp}`,
      paymentId: "not-real",
      status: "SUCCEEDED",
    }),
  });
  expectStatus("invalid webhook signature", badWebhook.status, 401);
  const stillPending = await prisma.order.findUniqueOrThrow({
    where: { id: order.id },
  });
  if (stillPending.status === "PAID") {
    throw new Error("invalid webhook marked order PAID");
  }
  pass("Payment Security");

  const category = await prisma.category.findFirst({
    where: { isActive: true },
  });
  if (!category) {
    throw new Error("need a category");
  }
  const hidden = await prisma.product.create({
    data: {
      name: "Hidden Security Product",
      slug: `sec-hidden-${stamp}`,
      description: "should not leak",
      price: new Prisma.Decimal("10.00"),
      stock: 1,
      categoryId: category.id,
      images: ["/placeholders/tshirt.svg"],
      isActive: false,
    },
  });
  createdProductIds.push(hidden.id);

  const leakedList = await request("/api/products?isActive=false");
  expectStatus("public inactive list", leakedList.status, 200);
  const leakedItems = (
    leakedList.body.data as { items: { id: string }[] }
  ).items;
  if (leakedItems.some((item) => item.id === hidden.id)) {
    throw new Error("inactive product leaked to anonymous list");
  }
  const leakedDetail = await request(`/api/products/${hidden.id}`);
  expectStatus("public inactive detail", leakedDetail.status, 404);
  pass("Catalog Visibility");

  const hugeLimit = await request("/api/products?limit=999999");
  expectStatus("huge limit", hugeLimit.status, 400);
  const pageZero = await request("/api/products?page=0");
  expectStatus("page 0", pageZero.status, 400);
  const badSort = await request("/api/products?sort=hack");
  expectStatus("invalid sort", badSort.status, 400);
  const longSearch = await request(`/api/products?search=${"a".repeat(200)}`);
  expectStatus("oversized search", longSearch.status, 400);
  const negativeQty = await request("/api/cart/items", {
    method: "POST",
    cookie: cookieB,
    body: JSON.stringify({ productId: product.id, quantity: -1 }),
  });
  expectStatus("negative quantity", negativeQty.status, 400);
  const malformed = await request("/api/auth/login", {
    method: "POST",
    body: "{",
  });
  expectStatus("malformed json", malformed.status, 400);
  pass("Input Validation");

  let sawRateLimit = false;
  for (let i = 0; i < 12; i += 1) {
    const attempt = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: bruteEmail, password: "Wrongpass1" }),
    });
    if (attempt.status === 429) {
      sawRateLimit = true;
      expectCode("rate limit", attempt.body, "TOO_MANY_REQUESTS");
      break;
    }
    if (attempt.status !== 401) {
      throw new Error(`brute force expected 401 or 429, got ${attempt.status}`);
    }
  }
  if (!sawRateLimit) {
    throw new Error("repeated failed logins were not rate limited");
  }
  pass("Rate Limiting");
}

main()
  .catch((error) => {
    fail("suite", error);
  })
  .finally(async () => {
    for (const [id, stock] of originalStock) {
      await prisma.product.update({ where: { id }, data: { stock } });
    }
    if (createdProductIds.length > 0) {
      try {
        await prisma.product.deleteMany({
          where: { id: { in: createdProductIds } },
        });
      } catch {
        await prisma.product.updateMany({
          where: { id: { in: createdProductIds } },
          data: { isActive: false },
        });
      }
    }
    await prisma.$disconnect();
    if (failed > 0) {
      process.exit(1);
    }
  });
