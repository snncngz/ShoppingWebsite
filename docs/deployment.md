# VELORA deployment (FAZ 12.13)

Generic deployment flow. The app stays portable across VPS, Docker, or a Node host. Do not treat `next dev` as a deploy method.

## Target flow

```text
GitHub
  → install (npm ci)
  → prisma generate
  → typecheck / tests (CI)
  → prisma migrate deploy  (against production DB)
  → npm run build
  → set environment variables
  → npm run start
  → GET /api/health (expect database: ok)
```

## One-time production setup

1. Provision PostgreSQL and note `DATABASE_URL` (TLS preferred).
2. Generate secrets (`AUTH_SECRET`, `PAYMENT_WEBHOOK_SECRET`) with a CSPRNG — never reuse development values.
3. Set `API_BASE_URL` to the public `https://` origin.
4. Configure payment: either keep `PAYMENT_PROVIDER=test` until go-live, or set live iyzico keys + non-sandbox `IYZICO_BASE_URL`.
5. Set `MAIL_FROM` and either `RESEND_API_KEY` or SMTP (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) so new users can verify their email.
6. Point DNS / TLS termination at the Node process (or reverse proxy).

## Deploy commands

```bash
npm ci --include=dev
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start
```

On Render (and similar hosts), set **Build Command** to a single line:

```bash
npm ci --include=dev && npx prisma generate && npx prisma migrate deploy && npm run build
```

Use `npm ci --include=dev`. Render sets `NODE_ENV=production` during build, so a plain `npm ci` skips `devDependencies` and `next build` fails (missing Tailwind/PostCSS). Tailwind CSS packages also live in `dependencies` so a production install can still compile styles. **Start Command** stays `npm run start`.

Health check path: `/api/health`.

Create the admin account once:

```bash
npm run create-admin
```

Do **not** run `npm run db:seed` in production (blocked when `NODE_ENV=production`).

## Health after deploy

```bash
curl -sS https://your-domain.com/api/health
```

Expect HTTP 200 and `"database":"ok"`. HTTP 503 means the process is up but PostgreSQL is not ready — do not route traffic.

## CI suggestion

Minimal pipeline (no production secrets required beyond dummy build env if needed):

```text
npm ci
npx prisma generate
npm run typecheck
npm run build
```

Run integration suites (`test:auth`, `test:cart`, …) against a staging database and `npm run start`, not against production.

A starter workflow lives at `.github/workflows/ci.yml`.

## Platform notes

| Concern | Guidance |
| --- | --- |
| Process | Long-lived Node (`next start`). Prefer one or few instances; in-memory rate limits are per process. |
| Pooling | Use the host’s pooler URL if the provider supplies one (especially serverless). |
| Webhooks | Public HTTPS URL to `/api/payments/webhook` with the production webhook secret. |
| Static | Next build output under `.next/` — do not commit it. |
| Docker | Optional; image should run `migrate deploy` as a release step, then `next start`. |

## Rollback

See [production.md](./production.md#rollback). Prefer previous app artifact + forward-fix DB migrations, or restore DB from backup if schema/data is corrupted.


npm run dev