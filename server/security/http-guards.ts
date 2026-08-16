import { forbidden, tooManyRequests } from "@/server/api/errors";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 20_000;

function prune(now: number) {
  if (buckets.size < MAX_BUCKETS) {
    return;
  }
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function assertRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): void {
  const now = Date.now();
  prune(now);
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  current.count += 1;
  if (current.count > limit) {
    tooManyRequests("Too many requests");
  }
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first.slice(0, 64);
    }
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp ? realIp.slice(0, 64) : "local";
}

const CSRF_EXEMPT = [
  "/api/payments/webhook",
  "/api/payments/iyzico/callback",
];

export function assertSameOrigin(request: Request, pathname: string): void {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return;
  }
  if (CSRF_EXEMPT.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return;
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return;
  }

  let requestOrigin = "";
  try {
    requestOrigin = new URL(request.url).origin;
  } catch {
    return;
  }

  if (origin === requestOrigin) {
    return;
  }

  const configured = process.env.API_BASE_URL?.trim();
  if (configured) {
    try {
      if (origin === new URL(configured).origin) {
        return;
      }
    } catch {
      // ignore invalid API_BASE_URL
    }
  }

  forbidden("Cross-origin request blocked");
}

function limitFor(pathname: string, method: string): { limit: number; windowMs: number } | null {
  if (pathname === "/api/health") {
    return null;
  }

  const upper = method.toUpperCase();
  if (pathname === "/api/auth/login") {
    return { limit: 80, windowMs: 10 * 60 * 1000 };
  }
  if (pathname === "/api/auth/register") {
    return { limit: 60, windowMs: 10 * 60 * 1000 };
  }
  if (pathname.startsWith("/api/auth/")) {
    return { limit: 60, windowMs: 10 * 60 * 1000 };
  }
  if (pathname === "/api/payments/webhook") {
    return { limit: 120, windowMs: 5 * 60 * 1000 };
  }
  if (pathname.startsWith("/api/payments")) {
    return { limit: 40, windowMs: 5 * 60 * 1000 };
  }
  if (pathname === "/api/orders" && upper === "POST") {
    return { limit: 40, windowMs: 5 * 60 * 1000 };
  }
  if (upper === "GET" || upper === "HEAD") {
    return { limit: 240, windowMs: 60 * 1000 };
  }
  return { limit: 80, windowMs: 5 * 60 * 1000 };
}

export function enforceApiGuards(request: Request): void {
  let pathname = "/";
  try {
    pathname = new URL(request.url).pathname;
  } catch {
    return;
  }

  assertSameOrigin(request, pathname);

  const spec = limitFor(pathname, request.method);
  if (!spec) {
    return;
  }

  assertRateLimit(
    `${request.method}:${pathname}:${clientIp(request)}`,
    spec.limit,
    spec.windowMs,
  );
}
