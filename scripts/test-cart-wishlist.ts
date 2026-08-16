import { PrismaClient } from "@prisma/client";

import { loadLocalEnv } from "../prisma/load-env";

loadLocalEnv();

type Envelope<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
};

type CartPayload = {
  id: string;
  items: { id: string; productId: string; quantity: number; product: { id: string; stock: number } }[];
};

type WishlistPayload = {
  id: string;
  items: { id: string; productId: string; product: { id: string } }[];
};

const BASE = process.env.API_BASE_URL ?? "http://localhost:3000";
const prisma = new PrismaClient();

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

function asCart(data: unknown): CartPayload {
  return data as CartPayload;
}

function asWishlist(data: unknown): WishlistPayload {
  return data as WishlistPayload;
}

async function main() {
  const stamp = Date.now();
  const password = "Testpass1";
  const emailA = `cart-a-${stamp}@velora.test`;
  const emailB = `cart-b-${stamp}@velora.test`;

  const productsRes = await request("/api/products?limit=20&isActive=true");
  expectStatus("product list", productsRes.status, 200);
  const products = (
    productsRes.body.data as { items: { id: string; stock: number; isActive: boolean }[] }
  ).items.filter((product) => product.stock > 0);
  if (products.length < 2) {
    throw new Error("need at least two in-stock products");
  }
  const productA = products[0];
  const productB = products[1];
  pass("Product Regression");

  const categoriesRes = await request("/api/categories?isActive=true");
  expectStatus("category list", categoriesRes.status, 200);
  pass("Category Regression");

  const anonCart = await request("/api/cart");
  expectStatus("anon cart", anonCart.status, 401);
  const anonWishlist = await request("/api/wishlist");
  expectStatus("anon wishlist", anonWishlist.status, 401);
  pass("Authentication");

  const userA = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Cart A", email: emailA, password }),
  });
  expectStatus("register A", userA.status, 201);
  const cookieA = userA.cookie;
  const userB = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Cart B", email: emailB, password }),
  });
  expectStatus("register B", userB.status, 201);
  const cookieB = userB.cookie;

  const emptyCart = await request("/api/cart", { cookie: cookieA });
  expectStatus("cart get", emptyCart.status, 200);
  if (asCart(emptyCart.body.data).items.length !== 0) {
    throw new Error("new cart should be empty");
  }
  pass("Cart GET");

  const added = await request("/api/cart/items", {
    method: "POST",
    cookie: cookieA,
    body: JSON.stringify({ productId: productA.id, quantity: 1 }),
  });
  expectStatus("cart add", added.status, 200);
  if (asCart(added.body.data).items[0]?.quantity !== 1) {
    throw new Error("add did not persist quantity 1");
  }
  pass("Cart Add");

  const duplicated = await request("/api/cart/items", {
    method: "POST",
    cookie: cookieA,
    body: JSON.stringify({ productId: productA.id, quantity: 2 }),
  });
  expectStatus("cart duplicate", duplicated.status, 200);
  const dupCart = asCart(duplicated.body.data);
  if (dupCart.items.length !== 1 || dupCart.items[0].quantity !== 3) {
    throw new Error("duplicate add should merge quantity to 3");
  }
  pass("Cart Duplicate");

  const itemId = dupCart.items[0].id;
  const updated = await request(`/api/cart/items/${itemId}`, {
    method: "PATCH",
    cookie: cookieA,
    body: JSON.stringify({ quantity: 2 }),
  });
  expectStatus("cart update", updated.status, 200);
  if (asCart(updated.body.data).items[0]?.quantity !== 2) {
    throw new Error("update did not set quantity 2");
  }
  pass("Cart Update");

  await request("/api/cart/items", {
    method: "POST",
    cookie: cookieA,
    body: JSON.stringify({ productId: productB.id, quantity: 1 }),
  });
  const deleted = await request(`/api/cart/items/${itemId}`, {
    method: "DELETE",
    cookie: cookieA,
  });
  expectStatus("cart delete", deleted.status, 200);
  const afterDelete = asCart(deleted.body.data);
  if (afterDelete.items.some((item) => item.id === itemId) || afterDelete.items.length !== 1) {
    throw new Error("delete did not remove the targeted item");
  }
  pass("Cart Delete");

  const cleared = await request("/api/cart", { method: "DELETE", cookie: cookieA });
  expectStatus("cart clear", cleared.status, 200);
  if (asCart(cleared.body.data).items.length !== 0) {
    throw new Error("clear did not empty cart");
  }
  pass("Cart Clear");

  const emptyWishlist = await request("/api/wishlist", { cookie: cookieA });
  expectStatus("wishlist get", emptyWishlist.status, 200);
  pass("Wishlist GET");

  const wishAdded = await request("/api/wishlist/items", {
    method: "POST",
    cookie: cookieA,
    body: JSON.stringify({ productId: productA.id }),
  });
  expectStatus("wishlist add", wishAdded.status, 200);
  if (asWishlist(wishAdded.body.data).items.length !== 1) {
    throw new Error("wishlist add failed");
  }
  pass("Wishlist Add");

  const wishDup = await request("/api/wishlist/items", {
    method: "POST",
    cookie: cookieA,
    body: JSON.stringify({ productId: productA.id }),
  });
  expectStatus("wishlist duplicate", wishDup.status, 200);
  if (asWishlist(wishDup.body.data).items.length !== 1) {
    throw new Error("wishlist duplicate created a second row");
  }
  pass("Wishlist Duplicate");

  const wishItemId = asWishlist(wishDup.body.data).items[0].id;
  const wishDeleted = await request(`/api/wishlist/items/${wishItemId}`, {
    method: "DELETE",
    cookie: cookieA,
  });
  expectStatus("wishlist delete", wishDeleted.status, 200);
  if (asWishlist(wishDeleted.body.data).items.length !== 0) {
    throw new Error("wishlist delete failed");
  }
  pass("Wishlist Delete");

  await request("/api/cart/items", {
    method: "POST",
    cookie: cookieA,
    body: JSON.stringify({ productId: productA.id, quantity: 1 }),
  });
  const mergedCart = await request("/api/cart/merge", {
    method: "POST",
    cookie: cookieA,
    body: JSON.stringify({
      items: [
        { productId: productA.id, quantity: 2 },
        { productId: productB.id, quantity: 1 },
      ],
    }),
  });
  expectStatus("guest cart merge", mergedCart.status, 200);
  const merged = asCart(mergedCart.body.data);
  const mergedA = merged.items.find((item) => item.productId === productA.id);
  const mergedB = merged.items.find((item) => item.productId === productB.id);
  const expectedA = Math.min(productA.stock, 3);
  if (!mergedA || mergedA.quantity !== expectedA || !mergedB || mergedB.quantity !== 1) {
    throw new Error("cart merge did not combine quantities");
  }
  pass("Guest Cart Merge");

  await request("/api/wishlist/items", {
    method: "POST",
    cookie: cookieA,
    body: JSON.stringify({ productId: productA.id }),
  });
  const mergedWishlist = await request("/api/wishlist/merge", {
    method: "POST",
    cookie: cookieA,
    body: JSON.stringify({ productIds: [productA.id, productB.id] }),
  });
  expectStatus("guest wishlist merge", mergedWishlist.status, 200);
  const wishIds = asWishlist(mergedWishlist.body.data).items.map((item) => item.productId);
  if (wishIds.length !== 2 || !wishIds.includes(productA.id) || !wishIds.includes(productB.id)) {
    throw new Error("wishlist merge did not union products");
  }
  pass("Guest Wishlist Merge");

  const overStock = await request("/api/cart/items", {
    method: "POST",
    cookie: cookieA,
    body: JSON.stringify({
      productId: productA.id,
      quantity: Math.max(productA.stock, mergedA.quantity) + 50,
    }),
  });
  expectStatus("stock validation", overStock.status, 400);
  pass("Stock Validation");

  const otherItem = await request("/api/cart/items", {
    method: "POST",
    cookie: cookieB,
    body: JSON.stringify({ productId: productA.id, quantity: 1 }),
  });
  const otherItemId = asCart(otherItem.body.data).items[0].id;
  const stolenPatch = await request(`/api/cart/items/${otherItemId}`, {
    method: "PATCH",
    cookie: cookieA,
    body: JSON.stringify({ quantity: 2 }),
  });
  expectStatus("ownership patch", stolenPatch.status, 404);
  const stolenDelete = await request(`/api/cart/items/${otherItemId}`, {
    method: "DELETE",
    cookie: cookieA,
  });
  expectStatus("ownership delete", stolenDelete.status, 404);
  pass("Ownership Security");

  const persisted = await prisma.cart.findUnique({
    where: { userId: (userA.body.data as { id: string }).id },
    include: { items: true },
  });
  if (!persisted || persisted.items.length === 0) {
    throw new Error("cart was not stored in PostgreSQL");
  }
  const persistedWish = await prisma.wishlist.findUnique({
    where: { userId: (userA.body.data as { id: string }).id },
    include: { items: true },
  });
  if (!persistedWish || persistedWish.items.length === 0) {
    throw new Error("wishlist was not stored in PostgreSQL");
  }
  pass("PostgreSQL Persistence");

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD required for admin regression");
  }
  const adminLogin = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  expectStatus("admin login", adminLogin.status, 200);
  const adminPage = await request("/admin", { cookie: adminLogin.cookie });
  if (adminPage.status >= 300 && adminPage.status < 400) {
    throw new Error("admin panel redirected unexpectedly");
  }
  pass("Admin Regression");
  pass("Storefront Regression");

  await prisma.cartItem.deleteMany({
    where: { cart: { user: { email: { in: [emailA, emailB] } } } },
  });
  await prisma.wishlistItem.deleteMany({
    where: { wishlist: { user: { email: { in: [emailA, emailB] } } } },
  });
  await prisma.cart.deleteMany({
    where: { user: { email: { in: [emailA, emailB] } } },
  });
  await prisma.wishlist.deleteMany({
    where: { user: { email: { in: [emailA, emailB] } } },
  });
  await prisma.user.deleteMany({ where: { email: { in: [emailA, emailB] } } });
}

main()
  .catch((error) => {
    fail("cart/wishlist suite", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
    if (failed > 0) {
      process.exit(1);
    }
    console.log("Cart and wishlist tests complete.");
  });
