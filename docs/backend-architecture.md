# VELORA backend architecture (FAZ 12.1)

VELORA keeps a single Next.js 16 App Router codebase. There is no separate backend service. HTTP APIs live as Route Handlers under `app/api/`. Domain logic for those APIs lives in `server/` so it stays out of Client Components, `context/`, and the FAZ 11 localStorage catalog.

The storefront and demo admin panel still read `data/products.ts` through `lib/adminStore.ts` → `lib/catalog.ts` → `CatalogProvider`. That path is unchanged.

## Folder layout

```text
app/api/            Route Handlers only (thin HTTP adapters)
prisma/             schema.prisma and migrations
server/config/      Environment access
server/db/          Prisma Client singleton
server/api/         Response helpers, ApiError, route wrapper
server/services/    Use-case functions (health now; products later)
server/utils/       JSON parsing and field checks
types/api.ts        Shared API envelope types
```

`server/` must not be imported from `"use client"` modules. Secrets stay in `process.env` via `getServerEnv()`.

## API envelope

Success:

```json
{ "success": true, "data": {} }
```

Error:

```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Resource not found" }
}
```

Codes: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `METHOD_NOT_ALLOWED`, `INTERNAL_ERROR`.

Production 500 responses never include stack traces. Unexpected errors are logged on the server.

Wrap handlers with `apiRoute()` so thrown `ApiError` values become the envelope above.

## REST conventions (not implemented yet)

| Method | Use |
| --- | --- |
| `GET` | Read a collection or one resource |
| `POST` | Create |
| `PUT` | Replace an existing resource |
| `PATCH` | Partial update |
| `DELETE` | Remove |

Planned resource paths:

```text
GET    /api/products
POST   /api/products
GET    /api/products/:id
PUT    /api/products/:id
PATCH  /api/products/:id
DELETE /api/products/:id

GET    /api/categories
POST   /api/categories
GET    /api/categories/:id
PUT    /api/categories/:id
DELETE /api/categories/:id

POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/orders
GET    /api/orders/:id
POST   /api/orders
```

Do not add these routes in 12.1.

## Health

`GET /api/health`

```json
{ "success": true, "data": { "status": "ok", "database": "ok" } }
```

`status` is the API process. `database` is `"ok"` when Prisma can run `SELECT 1` against PostgreSQL, otherwise `"unavailable"`.

## Environment

`.env.example` documents variables. Copy to `.env.local` (Next.js) and `.env` (Prisma CLI). Both files are gitignored.

| Variable | When it is used |
| --- | --- |
| `DATABASE_URL` | Prisma Client and Prisma CLI |
| `API_BASE_URL` | Future server-side fetches; default `http://localhost:3000` |

No real credentials belong in source or in `.env.example`.

## Database (FAZ 12.2A / 12.2B)

Prisma Client lives in `server/db/prisma.ts` and is created once (singleton for Next.js hot reload). Import it only from `server/` or `app/api/`.

Models: `User`, `Category`, `Product`, `Order`, `OrderItem`, `Cart`, `CartItem`, `Wishlist`, `WishlistItem`.

Delete rules: `Product` and `User` are `Restrict` on `Order` / `OrderItem` so history is kept. Hide products with `Product.isActive`. `Category` delete is `Restrict` on `Product`. Cart and wishlist rows cascade when their parent user/cart/wishlist is removed.

Prices use `Decimal(12, 2)`. Product images/colors/sizes are `String[]`. Perfume notes are `Json`. Frontend `types.Product` is unchanged; map in `server/services` later.

Runtime path:

```text
Next.js
   ↓
app/api
   ↓
server/services
   ↓
server/db/prisma
   ↓
PostgreSQL
```

FAZ 11 leftover localStorage catalog helpers remain in `lib/catalog.ts` for unused merge paths. Storefront runtime catalog comes from the API.

Development seed (`npx prisma db seed` / `npm run db:seed`) upserts one test user, category, product, cart, wishlist, and order identified by `db-seed@velora.test` and `db-seed-*` slugs. It does not touch `data/products.ts`. Re-run is safe. Extra verification rows are created and deleted by `npm run db:verify`.

## Product and Category API (FAZ 12.3)

```text
GET    /api/products
GET    /api/products/:id
POST   /api/products
PATCH  /api/products/:id
DELETE /api/products/:id   (sets isActive = false)

GET    /api/categories
GET    /api/categories/:id
POST   /api/categories
PATCH  /api/categories/:id
DELETE /api/categories/:id (sets isActive = false)
```

Route Handlers in `app/api/` call `server/services/products.ts` and `server/services/categories.ts`. JSON uses DTOs in `types/api.ts`; Prisma `Decimal` is converted to `number`.

FAZ 12.4A: Admin Product pages (`/admin/urunler`) call `/api/products`.

FAZ 12.4B: Admin Category pages (`/admin/kategoriler`) call `/api/categories`.

FAZ 12.5A: Storefront catalog (`CatalogProvider`) loads active products from `GET /api/products` and categories from `GET /api/categories`. Requests use `cache: "no-store"`; the client refreshes when the tab becomes visible. `data/products.ts` remains as demo/reference data and is not the runtime catalog.

FAZ 12.5B: Search uses `GET /api/products?search=`. Category pages use `?category=` and `?sort=`. Product detail uses `?slug=` on the existing list endpoint. Color/size/stock chips stay client-side on the API result set because the Product API has no those query params.

## Orders (FAZ 12.8 / 12.9)

Authenticated users create and read their own orders:

```text
POST   /api/orders
GET    /api/orders
GET    /api/orders/:id
```

`POST /api/orders` runs in a single Prisma transaction: empty cart is 400, inactive/insufficient stock is 409, `unitPrice` is snapshotted from the product row, status starts as `PENDING`, stock is decremented, cart items are cleared. `GET /api/orders/:id` is owner-only; another user receives 404.

Admin order management is a separate surface (`requireAdmin()`). It does not reuse the user list endpoint to collect other users' orders:

```text
GET    /api/admin/orders?page=&limit=&status=&search=
GET    /api/admin/orders/:id
PATCH  /api/admin/orders/:id   (body: { "status": "PROCESSING" })
```

Status values are the Prisma `OrderStatus` whitelist (`PENDING`, `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`). Invalid status is 400. Missing order is 404. USER is 403; anonymous is 401. Cancel sets `CANCELLED`; orders are not deleted. Status updates do not change stock. Admin responses include customer `{ id, name, email }` only — never `passwordHash`. List `limit` is capped at 50. Admin UI: `/admin/siparisler`.

