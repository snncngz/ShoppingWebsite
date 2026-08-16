import { PrismaClient } from "@prisma/client";

import { loadLocalEnv } from "../prisma/load-env";
import { verifyPassword } from "../server/auth/password";

loadLocalEnv();

type Envelope<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
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
): Promise<{ status: number; body: Envelope<unknown>; cookie: string; location: string | null }> {
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
    location: response.headers.get("location"),
  };
}

function expectStatus(name: string, actual: number, expected: number) {
  if (actual !== expected) {
    throw new Error(`${name}: expected ${expected}, got ${actual}`);
  }
}

async function main() {
  const stamp = Date.now();
  const email = `auth-test-${stamp}@velora.test`;
  const password = "Testpass1";
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  const registered = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Auth Test",
      email,
      password,
    }),
  });
  expectStatus("register", registered.status, 201);
  const user = registered.body.data as { email?: string; role?: string; passwordHash?: unknown };
  if (user.email !== email || user.role !== "USER" || user.passwordHash) {
    throw new Error("register response leaked hash or had wrong role");
  }
  pass("Register creates USER session");

  const duplicate = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Auth Test", email, password }),
  });
  expectStatus("duplicate email", duplicate.status, 409);
  pass("Duplicate email rejected");

  const invalidEmail = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Auth Test", email: "not-an-email", password }),
  });
  expectStatus("invalid email", invalidEmail.status, 400);
  pass("Invalid email rejected");

  const weakPassword = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Auth Test", email: `weak-${stamp}@velora.test`, password: "short" }),
  });
  expectStatus("weak password", weakPassword.status, 400);
  pass("Weak password rejected");

  const login = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  expectStatus("login", login.status, 200);
  pass("Login with correct credentials");

  const wrongPassword = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: "Wrongpass1" }),
  });
  expectStatus("wrong password", wrongPassword.status, 401);
  pass("Wrong password rejected");

  const missingUser = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: `missing-${stamp}@velora.test`, password }),
  });
  expectStatus("missing email", missingUser.status, 401);
  pass("Unknown email rejected");

  const me = await request("/api/auth/me", { cookie: login.cookie });
  expectStatus("me", me.status, 200);
  const meUser = me.body.data as { email?: string; passwordHash?: unknown };
  if (meUser.email !== email || meUser.passwordHash) {
    throw new Error("/api/auth/me returned unexpected payload");
  }
  pass("/api/auth/me returns current user");

  const stored = await prisma.user.findUniqueOrThrow({ where: { email } });
  if (stored.passwordHash === password || !stored.passwordHash.startsWith("scrypt:")) {
    throw new Error("password was stored in plaintext");
  }
  if (!(await verifyPassword(password, stored.passwordHash))) {
    throw new Error("stored hash did not verify");
  }
  if (stored.role !== "USER") {
    throw new Error(`expected USER role, got ${stored.role}`);
  }
  pass("Password hashed and role stored");

  const userMutation = await request("/api/products", {
    method: "POST",
    cookie: login.cookie,
    body: JSON.stringify({ name: "Nope" }),
  });
  expectStatus("user product POST", userMutation.status, 403);
  pass("USER cannot call admin product API");

  const anonMutation = await request("/api/products", {
    method: "POST",
    body: JSON.stringify({ name: "Nope" }),
  });
  expectStatus("anon product POST", anonMutation.status, 401);
  pass("Unauthenticated user cannot call admin product API");

  const publicProducts = await request("/api/products");
  expectStatus("public product GET", publicProducts.status, 200);
  pass("Public product GET still works");

  const logout = await request("/api/auth/logout", {
    method: "POST",
    cookie: login.cookie,
  });
  expectStatus("logout", logout.status, 200);
  const meAfterLogout = await request("/api/auth/me", { cookie: logout.cookie || login.cookie });
  expectStatus("me after logout", meAfterLogout.status, 401);
  pass("Logout clears session");

  const adminPageAnon = await request("/admin");
  if (adminPageAnon.status !== 307 && adminPageAnon.status !== 308 && adminPageAnon.status !== 302) {
    throw new Error(`unauthenticated /admin expected redirect, got ${adminPageAnon.status}`);
  }
  if (!adminPageAnon.location?.includes("/admin/giris")) {
    throw new Error(`unauthenticated /admin redirected to ${adminPageAnon.location}`);
  }
  pass("Unauthenticated user cannot open admin panel");

  const userRelogin = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const adminPageUser = await request("/admin", { cookie: userRelogin.cookie });
  if (adminPageUser.status !== 307 && adminPageUser.status !== 308 && adminPageUser.status !== 302) {
    throw new Error(`USER /admin expected redirect, got ${adminPageUser.status}`);
  }
  if (adminPageUser.location && new URL(adminPageUser.location, BASE).pathname === "/admin") {
    throw new Error("USER was allowed to stay on /admin");
  }
  pass("USER cannot open admin panel");

  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required for admin tests");
  }

  const adminLogin = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  expectStatus("admin login", adminLogin.status, 200);
  const adminMe = await request("/api/auth/me", { cookie: adminLogin.cookie });
  const adminUser = adminMe.body.data as { role?: string };
  if (adminUser.role !== "ADMIN") {
    throw new Error("admin login did not return ADMIN role");
  }

  const categories = await request("/api/categories");
  const categoryItems = categories.body.data as { id: string }[] | undefined;
  if (!categoryItems?.length) {
    throw new Error("no categories available for admin product test");
  }

  const adminCreate = await request("/api/products", {
    method: "POST",
    cookie: adminLogin.cookie,
    body: JSON.stringify({
      name: `Auth Test Product ${stamp}`,
      slug: `auth-test-product-${stamp}`,
      description: "Temporary auth authorization product",
      price: 10,
      stock: 1,
      categoryId: categoryItems[0].id,
    }),
  });
  expectStatus("admin product POST", adminCreate.status, 201);
  const created = adminCreate.body.data as { id: string };
  await request(`/api/products/${created.id}`, {
    method: "DELETE",
    cookie: adminLogin.cookie,
  });
  pass("ADMIN can call admin product API");

  const adminPage = await request("/admin", { cookie: adminLogin.cookie });
  if (adminPage.status >= 300 && adminPage.status < 400) {
    throw new Error(`ADMIN /admin redirected to ${adminPage.location}`);
  }
  if (adminPage.status !== 200) {
    throw new Error(`ADMIN /admin expected 200, got ${adminPage.status}`);
  }
  pass("ADMIN can open admin panel");

  await prisma.user.delete({ where: { email } }).catch(() => undefined);
}

main()
  .catch((error) => {
    fail("auth suite", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
    if (failed > 0) {
      process.exit(1);
    }
    console.log("Authentication tests complete.");
  });
