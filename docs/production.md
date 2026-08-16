# VELORA production readiness (FAZ 12.13)

Platform-agnostic notes for running the Next.js + Prisma + PostgreSQL backend in production. Real secret values must never appear in this file or in git.

## Architecture

```text
Client
  → Next.js (app/api + proxy)
  → server/services
  → Prisma singleton
  → PostgreSQL
```

Do not run `npm run dev` as the production process. Use `npm run build` then `npm run start`.

## Environment variables

| Variable | Required in hosted production | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `AUTH_SECRET` | yes | ≥ 32 characters; signs session cookies |
| `API_BASE_URL` | yes | Public `https://` origin (not localhost) |
| `PAYMENT_WEBHOOK_SECRET` | yes | Dedicated webhook HMAC secret |
| `PAYMENT_PROVIDER` | recommended | `test` or `iyzico` |
| `PAYMENT_CURRENCY` | no | Defaults to `TRY` |
| `IYZICO_API_KEY` | when `PAYMENT_PROVIDER=iyzico` | Live key only |
| `IYZICO_SECRET_KEY` | when `PAYMENT_PROVIDER=iyzico` | Live secret only |
| `IYZICO_BASE_URL` | when live iyzico | Must not be sandbox in hosted production |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | bootstrap only | Used by `npm run create-admin` |

Startup validation runs from `instrumentation.ts` via `assertProductionEnv()` (skipped during `next build`). Missing names are reported; secret values are never logged.

Local `next start` with `API_BASE_URL` on localhost is allowed for smoke tests and may reuse `AUTH_SECRET` as the webhook secret.

## Seed vs admin

- `npm run db:seed` / `prisma db seed` **refuses** to run when `NODE_ENV=production`.
- Create the first admin with `npm run create-admin` after migrations.
- Demo users, carts, wishlists, and orders from `prisma/seed.ts` are development-only.

## Logging and monitoring

Structured JSON logs (`INFO` / `WARN` / `ERROR`) from `server/logging/logger.ts`.

- Sensitive keys (`password`, `secret`, `token`, `cookie`, …) are redacted.
- Each API request gets `X-Request-Id` (incoming header or generated UUID).
- Unhandled server errors go through `instrumentation.onRequestError` and `toErrorResponse`.
- No third-party APM is bundled. Wire Sentry (or similar) later by extending `onRequestError` if needed — never send secrets.

## Health check

`GET /api/health`

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "ok",
    "environment": "production"
  }
}
```

- Database down → HTTP **503**, `status: "degraded"`, `database: "unavailable"`.
- Never returns connection strings, stacks, or secrets.
- Use this endpoint for both process liveness (process responds) and readiness (database ok). Prefer failing the load balancer check on 503.

## Database

- Client: singleton in `server/db/prisma.ts` (one `PrismaClient` per process).
- Production migrations: `npx prisma migrate deploy` only — never `migrate dev` against production.
- Graceful shutdown: `SIGTERM` / `SIGINT` disconnect Prisma.
- Managed Postgres (Neon, Supabase, RDS, etc.): enable connection pooling per provider docs; keep `DATABASE_URL` on the server only.

## Performance (review)

- Product/category list and detail use single queries with category `include` (no N+1 on list).
- Cart, wishlist, orders, admin orders use bounded includes + pagination caps (`limit` ≤ 50–100).
- Storefront and shop/admin clients fetch with `cache: "no-store"`.
- API responses send `Cache-Control: private, no-store`.
- Authenticated cart/wishlist/order/payment payloads must never be publicly cached.

## Security (FAZ 12.12 still required)

- `NODE_ENV=production` → Secure session cookies.
- HttpOnly + SameSite=lax, rate limits, ownership 404s, security headers, CSRF Origin checks remain active.
- Hosted production must set an explicit `PAYMENT_WEBHOOK_SECRET`.

## Payment production

- Amount and paid status come from the order + provider/webhook — never from the client.
- Webhook: HTTPS, HMAC (`x-payment-signature`), idempotent `PaymentEvent.eventId`.
- Keep sandbox credentials out of hosted production.

## Backup and restore

Application code does not implement backups. Use the database provider:

```text
PostgreSQL (managed)
  → automated daily (or continuous) backups
  → retention ≥ 7–30 days
  → tested restore to a staging database
```

Recommended minimum:

| Item | Guidance |
| --- | --- |
| Frequency | Daily full + continuous WAL / point-in-time if available |
| Retention | At least 7 days (30 days preferred) |
| Restore | Documented restore-to-new-instance procedure; test quarterly |
| Pre-migrate | Snapshot or verify PITR before applying migrations |

Never run destructive restore drills against the live production database.

## Rollback

1. **App only:** redeploy the previous git revision / container image; run `npm run start` (or platform equivalent).
2. **Migrations:** Prisma migrations are forward-only in production. Do **not** auto-rollback SQL. If a migration is bad, fix forward with a new migration or restore DB from backup, then redeploy a compatible app version.
3. **Config:** revert env vars in the host; restart the process.

Destructive / data-loss risk migrations (drop column/table) must be reviewed before deploy. Current VELORA migrations are additive ecommerce schema changes; still take a backup before `migrate deploy`.
