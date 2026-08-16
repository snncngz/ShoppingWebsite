import { createHmac } from "node:crypto";

import { Prisma, PrismaClient } from "@prisma/client";

import { loadLocalEnv } from "../prisma/load-env";

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

function webhookSecret(): string {
  return (
    process.env.PAYMENT_WEBHOOK_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    ""
  );
}

function sign(raw: string): string {
  return createHmac("sha256", webhookSecret()).update(raw).digest("hex");
}

async function request(
  path: string,
  init: RequestInit & { cookie?: string } = {},
): Promise<{ status: number; body: Envelope<unknown>; cookie: string }> {
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
  };
}

function expectStatus(name: string, actual: number, expected: number) {
  if (actual !== expected) {
    throw new Error(`${name}: expected ${expected}, got ${actual}`);
  }
}

async function main() {
  if (!webhookSecret()) {
    throw new Error("AUTH_SECRET or PAYMENT_WEBHOOK_SECRET is required");
  }

  const stamp = Date.now();
  const password = "Testpass1";
  const emailA = `pay-a-${stamp}@velora.test`;
  const emailB = `pay-b-${stamp}@velora.test`;
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  const anon = await request("/api/payments", {
    method: "POST",
    body: JSON.stringify({ orderId: "missing" }),
  });
  expectStatus("anon create", anon.status, 401);

  const anonWebhook = await request("/api/payments/webhook", {
    method: "POST",
    body: JSON.stringify({ eventId: "x" }),
  });
  expectStatus("anon unsigned webhook", anonWebhook.status, 401);

  const userA = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Pay A", email: emailA, password }),
  });
  expectStatus("register A", userA.status, 201);
  const cookieA = userA.cookie;

  const userB = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Pay B", email: emailB, password }),
  });
  expectStatus("register B", userB.status, 201);
  const cookieB = userB.cookie;

  const productsRes = await request("/api/products?limit=20&isActive=true");
  const product = (
    productsRes.body.data as { items: { id: string; stock: number }[] }
  ).items.find((item) => item.stock >= 2);
  if (!product) {
    throw new Error("need an in-stock product");
  }
  const stored = await prisma.product.findUniqueOrThrow({
    where: { id: product.id },
  });
  originalStock.set(product.id, { stock: stored.stock, price: stored.price });

  await request("/api/cart/items", {
    method: "POST",
    cookie: cookieA,
    body: JSON.stringify({ productId: product.id, quantity: 1 }),
  });
  const created = await request("/api/orders", {
    method: "POST",
    cookie: cookieA,
  });
  expectStatus("create order", created.status, 201);
  const order = created.body.data as {
    id: string;
    total: number;
    status: string;
  };
  const stockAfterOrder = await prisma.product.findUniqueOrThrow({
    where: { id: product.id },
  });

  const missing = await request("/api/payments", {
    method: "POST",
    cookie: cookieA,
    body: JSON.stringify({ orderId: "missing-order-id" }),
  });
  expectStatus("missing order", missing.status, 404);

  const foreign = await request("/api/payments", {
    method: "POST",
    cookie: cookieB,
    body: JSON.stringify({ orderId: order.id, amount: 1 }),
  });
  expectStatus("foreign order", foreign.status, 404);

  const paymentRes = await request("/api/payments", {
    method: "POST",
    cookie: cookieA,
    body: JSON.stringify({
      orderId: order.id,
      amount: 1,
      currency: "USD",
      status: "SUCCEEDED",
    }),
  });
  expectStatus("create payment", paymentRes.status, 201);
  const payment = paymentRes.body.data as {
    id: string;
    orderId: string;
    amount: number;
    currency: string;
    status: string;
    provider: string;
    checkoutUrl: string | null;
  };
  if (payment.amount !== order.total) {
    throw new Error("client amount was trusted");
  }
  if (payment.currency !== "TRY" || payment.status !== "PENDING") {
    throw new Error("payment currency/status not server-controlled");
  }
  if (payment.provider !== "IYZICO") {
    throw new Error("unexpected provider");
  }
  pass("Payment Creation");
  pass("Amount Verification");
  pass("Authorization");

  const dbPayment = await prisma.payment.findUniqueOrThrow({
    where: { id: payment.id },
  });

  const invalidSig = await request("/api/payments/webhook", {
    method: "POST",
    headers: { "x-payment-signature": "deadbeef" },
    body: JSON.stringify({
      eventId: `evt-bad-${stamp}`,
      eventType: "payment.succeeded",
      providerPaymentId: dbPayment.providerPaymentId,
    }),
  });
  expectStatus("invalid signature", invalidSig.status, 401);
  pass("Webhook Signature");

  const successBody = JSON.stringify({
    eventId: `evt-ok-${stamp}`,
    eventType: "payment.succeeded",
    providerPaymentId: dbPayment.providerPaymentId,
    amount: 1,
    status: "SUCCEEDED",
  });
  const success = await request("/api/payments/webhook", {
    method: "POST",
    headers: { "x-payment-signature": sign(successBody) },
    body: successBody,
  });
  expectStatus("success webhook", success.status, 200);

  const paidOrder = await prisma.order.findUniqueOrThrow({
    where: { id: order.id },
  });
  const paidPayment = await prisma.payment.findUniqueOrThrow({
    where: { id: payment.id },
  });
  if (paidPayment.status !== "SUCCEEDED" || paidOrder.status !== "PAID") {
    throw new Error("success did not mark payment/order");
  }
  const stockAfterPay = await prisma.product.findUniqueOrThrow({
    where: { id: product.id },
  });
  if (stockAfterPay.stock !== stockAfterOrder.stock) {
    throw new Error("payment success changed stock");
  }
  pass("Payment Success");
  pass("Order Integration");
  pass("Inventory Integration");

  const duplicate = await request("/api/payments/webhook", {
    method: "POST",
    headers: { "x-payment-signature": sign(successBody) },
    body: successBody,
  });
  expectStatus("duplicate event", duplicate.status, 200);
  if ((duplicate.body.data as { ignored?: boolean }).ignored !== true) {
    throw new Error("duplicate event was not ignored");
  }
  const stillPaid = await prisma.order.findUniqueOrThrow({
    where: { id: order.id },
  });
  if (stillPaid.status !== "PAID") {
    throw new Error("duplicate event changed order");
  }
  pass("Webhook Idempotency");

  const unknownBody = JSON.stringify({
    eventId: `evt-unknown-${stamp}`,
    eventType: "payment.unknown",
    providerPaymentId: dbPayment.providerPaymentId,
  });
  const unknown = await request("/api/payments/webhook", {
    method: "POST",
    headers: { "x-payment-signature": sign(unknownBody) },
    body: unknownBody,
  });
  expectStatus("unknown event", unknown.status, 200);
  pass("Webhook");

  await request("/api/cart/items", {
    method: "POST",
    cookie: cookieA,
    body: JSON.stringify({ productId: product.id, quantity: 1 }),
  });
  const failOrderRes = await request("/api/orders", {
    method: "POST",
    cookie: cookieA,
  });
  expectStatus("fail order", failOrderRes.status, 201);
  const failOrderId = (failOrderRes.body.data as { id: string }).id;
  const failPayRes = await request("/api/payments", {
    method: "POST",
    cookie: cookieA,
    body: JSON.stringify({ orderId: failOrderId }),
  });
  expectStatus("fail payment create", failPayRes.status, 201);
  const failPay = failPayRes.body.data as { id: string };
  const failDb = await prisma.payment.findUniqueOrThrow({
    where: { id: failPay.id },
  });
  const failBody = JSON.stringify({
    eventId: `evt-fail-${stamp}`,
    eventType: "payment.failed",
    providerPaymentId: failDb.providerPaymentId,
  });
  const failedHook = await request("/api/payments/webhook", {
    method: "POST",
    headers: { "x-payment-signature": sign(failBody) },
    body: failBody,
  });
  expectStatus("fail webhook", failedHook.status, 200);
  const failedPayment = await prisma.payment.findUniqueOrThrow({
    where: { id: failPay.id },
  });
  const failedOrder = await prisma.order.findUniqueOrThrow({
    where: { id: failOrderId },
  });
  if (failedPayment.status !== "FAILED" || failedOrder.status === "PAID") {
    throw new Error("failure marked order paid");
  }
  pass("Payment Failure");

  const retry = await request("/api/payments", {
    method: "POST",
    cookie: cookieA,
    body: JSON.stringify({ orderId: failOrderId }),
  });
  expectStatus("retry payment", retry.status, 201);
  if ((retry.body.data as { id: string }).id === failPay.id) {
    throw new Error("retry reused failed payment");
  }

  if (adminEmail && adminPassword) {
    const adminLogin = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    expectStatus("admin login", adminLogin.status, 200);
    const adminDetail = await request(`/api/admin/orders/${order.id}`, {
      cookie: adminLogin.cookie,
    });
    expectStatus("admin order", adminDetail.status, 200);
    const payments = (
      adminDetail.body.data as {
        payments: { status: string; amount: number; provider: string }[];
      }
    ).payments;
    if (!payments?.some((item) => item.status === "SUCCEEDED")) {
      throw new Error("admin detail missing payment");
    }
    const raw = JSON.stringify(adminDetail.body.data);
    if (raw.includes("passwordHash") || raw.includes("cardNumber") || raw.includes("cvv")) {
      throw new Error("sensitive fields leaked");
    }
  }

  const userPaid = await request(`/api/admin/orders/${order.id}`, {
    method: "PATCH",
    cookie: cookieA,
    body: JSON.stringify({ status: "PAID" }),
  });
  expectStatus("user cannot mark paid", userPaid.status, 403);

  pass("PostgreSQL");
}

main()
  .catch((error) => {
    fail("payments suite", error);
  })
  .finally(async () => {
    try {
      await prisma.paymentEvent.deleteMany({
        where: { payment: { order: { user: { email: { startsWith: "pay-" } } } } },
      });
      await prisma.payment.deleteMany({
        where: { order: { user: { email: { startsWith: "pay-" } } } },
      });
      await prisma.order.deleteMany({
        where: { user: { email: { startsWith: "pay-" } } },
      });
      await prisma.cartItem.deleteMany({
        where: { cart: { user: { email: { startsWith: "pay-" } } } },
      });
      await prisma.wishlistItem.deleteMany({
        where: { wishlist: { user: { email: { startsWith: "pay-" } } } },
      });
      await prisma.cart.deleteMany({
        where: { user: { email: { startsWith: "pay-" } } },
      });
      await prisma.wishlist.deleteMany({
        where: { user: { email: { startsWith: "pay-" } } },
      });
      await prisma.user.deleteMany({
        where: { email: { startsWith: "pay-" } },
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
    console.log("Payment tests complete.");
  });
