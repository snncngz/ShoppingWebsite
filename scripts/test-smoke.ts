type Envelope<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
};

const BASE = process.env.API_BASE_URL ?? "http://localhost:3000";

let failed = 0;

function pass(name: string) {
  console.log(`PASS  ${name}`);
}

function fail(name: string, error: unknown) {
  failed += 1;
  const message = error instanceof Error ? error.message : String(error);
  console.error(`FAIL  ${name}: ${message}`);
}

async function getJson(path: string): Promise<{
  status: number;
  body: Envelope<unknown>;
  headers: Headers;
}> {
  const response = await fetch(`${BASE}${path}`, { redirect: "manual" });
  let body: Envelope<unknown> = { success: false };
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    body = (await response.json()) as Envelope<unknown>;
  }
  return { status: response.status, body, headers: response.headers };
}

async function getPage(path: string): Promise<number> {
  const response = await fetch(`${BASE}${path}`, { redirect: "manual" });
  return response.status;
}

async function main() {
  const health = await getJson("/api/health");
  if (health.status !== 200 || !health.body.success) {
    throw new Error(`health expected 200 ok, got ${health.status}`);
  }
  const data = health.body.data as {
    status?: string;
    database?: string;
    environment?: string;
  };
  if (data.database !== "ok" || data.status !== "ok") {
    throw new Error(`health database not ready: ${JSON.stringify(data)}`);
  }
  if (!health.headers.get("x-request-id")) {
    throw new Error("missing X-Request-Id on health");
  }
  if (!health.headers.get("cache-control")?.includes("no-store")) {
    throw new Error("missing Cache-Control no-store");
  }
  pass("Health");

  const pages = [
    "/",
    "/tshirt",
    "/login",
    "/register",
    "/hesabim",
    "/sepet",
    "/favoriler",
    "/admin/giris",
  ];
  for (const path of pages) {
    const status = await getPage(path);
    if (status >= 500) {
      throw new Error(`${path} returned ${status}`);
    }
  }
  pass("Storefront pages");

  const products = await getJson("/api/products?limit=5&isActive=true");
  if (products.status !== 200 || !products.body.success) {
    throw new Error(`products list failed: ${products.status}`);
  }
  pass("Product API");

  const categories = await getJson("/api/categories?isActive=true");
  if (categories.status !== 200 || !categories.body.success) {
    throw new Error(`categories list failed: ${categories.status}`);
  }
  pass("Category API");

  const anonCart = await getJson("/api/cart");
  if (anonCart.status !== 401) {
    throw new Error(`anon cart expected 401, got ${anonCart.status}`);
  }
  pass("Auth gate");
}

main()
  .catch((error) => {
    fail("smoke suite", error);
  })
  .finally(() => {
    if (failed > 0) {
      process.exit(1);
    }
    console.log("Smoke tests complete.");
  });
