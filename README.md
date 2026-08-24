# NovaCart — Full-Stack E-Commerce Platform

A complete e-commerce application built as a monorepo: a **NestJS + MongoDB** REST API and a
**Next.js 15 + React 19** storefront, sharing one contract end to end.

The catalogue ships with a seed dataset — 56 products, 10 categories, 60 subcategories,
54 brands and 332 reviews, with all product, brand and category imagery served locally by
the API. Clone, seed, and you have a fully populated store.

```
E-commerce/
├── Backend/     NestJS 11 REST API  (port 5000)
└── Frontend/    Next.js 15 storefront (port 3000)
```

---

## Features

### Storefront

- **Product catalogue** — grid browsing with live client-side search, category and brand filtering
- **Product detail pages** — multi-image gallery with thumbnail navigation, ratings, and related products
- **Shopping cart** — add, update quantity, remove, clear; live item count in the navbar
- **Wishlist** — save and remove favourites from any product tile
- **Checkout** — shipping details form with validation, redirecting to Stripe Checkout
- **Accounts** — register (signed in automatically), log in, log out
- **Email verification** — a code is emailed on sign-up and confirmed on a dedicated
  page, with resend; never blocks use of the account, and a dismissible banner reminds
  anyone who skips it
- **Password recovery** — three-step flow: request code → verify code → set new password
- **Dark and light themes** — system-aware, with a manual toggle
- **Protected routes** — cart, wishlist and checkout require a session; signed-in users are
  redirected away from the auth pages
- **Polished UX** — animated transitions, toast notifications, skeleton and empty states,
  and a fully responsive layout

### API

**Catalogue**
- Products, categories, subcategories and brands with full CRUD
- Filtering, search, sorting (price, rating, newest, best-selling) and pagination
- Image upload with validation; files served statically and returned as absolute URLs
- Soft deletes with restore, and full created/updated/deleted audit trails

**Accounts and security**
- JWT access and refresh tokens with bcrypt password hashing
- Email verification that never blocks sign-in — the account is usable immediately,
  with a resend endpoint and a permanent `isVerified` flag
- OTP-based password reset with a server-verified code step
- Token invalidation on logout and password change
- Role-based authorisation (admin / user) enforced by guards
- Accepts both `Authorization: Bearer <jwt>` and a bare `token` header

**Commerce**
- Cart with server-side price calculation, stock checks and coupon support
- Wishlist with fully populated product data
- Reviews with `ratingsAverage` and `ratingsQuantity` denormalised onto products
  and recomputed on every write
- Orders: placement, cancellation, admin status management and refunds
- Inventory decremented at order placement; `sold` counted only once payment settles

**Payments**
- **Stripe Checkout** and **Paymob** integrations
- Signature-verified webhooks (Stripe raw-body HMAC, Paymob HMAC-SHA512)
- Idempotent settlement — replayed webhook events are safely ignored

**Platform**
- Transactional email through the **Brevo** API with EJS templates
- Optional Redis caching that degrades gracefully when unavailable
- Swagger API documentation and a health-check endpoint
- Repeatable database seeding from a versioned dataset

---

## Tech stack

| | |
|---|---|
| **Backend** | NestJS 11, TypeScript, MongoDB, Mongoose 9, JWT, bcrypt, class-validator, Multer, Brevo, EJS, ioredis, Stripe, Swagger |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, NextAuth, React Hook Form, Zod, Framer Motion, Swiper, Sonner, Axios |

---

## Getting started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis *(optional — the API runs without it)*

### 1. Backend

```bash
cd Backend
npm install
cp config/dev.env.example config/dev.env
```

Fill in `config/dev.env`:

| Variable | Purpose |
|---|---|
| `PORT` | API port (default `5000`) |
| `PUBLIC_URL` | Public base URL of the API, used to build absolute image URLs |
| `FRONTEND_URL` | Storefront origin, for CORS and payment redirects |
| `DB_URI` | MongoDB connection string |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Token signing secrets |
| `SALT_ROUNDS` | bcrypt cost factor |
| `BREVO_API_KEY` | Brevo API key (SMTP & API → API Keys) |
| `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` | Verified Brevo sender; falls back to `EMAIL_FROM` |
| `REDIS_ENABLED`, `REDIS_HOST`, `REDIS_PORT` | Cache settings; set `REDIS_ENABLED=false` to disable |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe credentials |
| `PAYMOB_*` | Paymob credentials |

Seed the catalogue and start the API:

```bash
npm run seed
npm run start:dev
```

The seed creates an admin account — `admin@novacart.dev` / `Admin@1234`.
Override with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.

> `npm run seed` is destructive: it clears the catalogue, cart and wishlist collections
> before rebuilding them from `Backend/seed/raw/`.

- API base — `http://localhost:5000/api/v1`
- Swagger — `http://localhost:5000/api/docs`
- Health — `http://localhost:5000/health`

### 2. Frontend

```bash
cd Frontend
npm install
```

Create `.env.local`:

```
API=http://localhost:5000/api/v1
NEXT_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
```

```bash
npm run dev
```

The storefront runs at `http://localhost:3000`.

---

## API overview

All routes are prefixed with `/api/v1`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/signup` | Register; returns a token and sends the verification email |
| `POST` | `/auth/signin` | Log in |
| `POST` | `/auth/confirm-email` | Confirm an email with its OTP |
| `POST` | `/auth/resend-verification` | Re-send the verification code |
| `POST` | `/auth/forgotPasswords` | Send a reset code |
| `POST` | `/auth/verifyResetCode` | Verify the reset code |
| `PUT`  | `/auth/resetPassword` | Set the new password |
| `GET`  | `/products` | List products (search, filter, sort, paginate) |
| `GET`  | `/products/:id` | Product detail |
| `GET`  | `/categories` · `/subcategories` · `/brands` | Taxonomy |
| `GET`  | `/cart` | Current user's cart |
| `POST` | `/cart` | Add an item |
| `PUT`  | `/cart/:productId` | Change line quantity |
| `DELETE` | `/cart/:productId` · `/cart` | Remove an item · empty the cart |
| `GET`/`POST`/`DELETE` | `/wishlist` | Manage the wishlist |
| `POST` | `/orders/checkout-session/:cartId` | Create an order and a Stripe Checkout session |
| `GET`  | `/orders/my-orders` | Order history |
| `POST` | `/reviews` | Leave a review |

Admin-only routes cover catalogue management, coupons, order status and refunds.
See Swagger for the full reference.

---

## Project structure

```
Backend/
├── src/
│   ├── auth/ user/ product/ category/ brand/
│   ├── cart/ wishlist/ review/ coupon/ order/
│   ├── common/          guards, decorators, interceptors, email, redis, utils
│   ├── DB/Models/       Mongoose schemas
│   └── seed/            database seeder
├── seed/raw/            catalogue snapshot (JSON)
└── uploads/seed/        catalogue imagery

Frontend/
└── src/
    ├── app/             routes and page components
    │   └── _components/ shared UI
    ├── AuthActions/ CartActions/ WishListActions/ CheckoutActions/ PasswordActions/
    ├── api/             catalogue data fetching
    ├── Schema/          Zod validation schemas
    ├── Types/           shared TypeScript types
    └── lib/api.ts       API client
```
