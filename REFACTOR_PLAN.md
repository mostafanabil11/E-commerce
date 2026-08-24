# Full-Stack Refactor Plan

Merging two independently-built apps (`Backend/` NestJS, `Frontend/` Next.js 15) into one
full-stack project, cutting the frontend over from the third-party Route Academy API to our
own backend, with a seeded dataset that mirrors what we're losing.

## Decisions taken

1. **Backend renames to match the frontend contract.** `name`→`title`, `stock`→`quantity`,
   `logo`→`image`, etc. One vocabulary end to end. The frontend's ~30 API-calling files and
   its `src/Types/*` stay as the source of truth for shape.
2. **Email verification is non-blocking.** Signup creates the account, sends the verification
   email, and returns a token (immediate login). Login is never gated on verification status.
   `isVerified` flips permanently once confirmed. A resend endpoint is provided.

## Phase 0 — Groundwork (DONE)

- [x] Removed all git history (`Backend/.git`, `Frontend/.git`, stray `~/.git`); backups in scratchpad
- [x] Captured full Route dataset -> `Backend/seed/raw/` (56 products, 10 categories, 54 brands, 60 subcategories)
- [x] Downloaded all 415 images -> `Backend/uploads/seed/` (22 MB, 0 failures)

## Phase 1 — Environment & wiring

- [x] Backend `PORT` 3000 -> 5000 (Next dev owns 3000); add `FRONTEND_URL`
- [x] Global prefix `api/v1`; pluralize controller routes (`product`->`products`, etc.)
- [x] Make Redis degrade gracefully when unavailable (currently refused on :6379)
- [x] Frontend: single `src/lib/api.ts` client reading `process.env.API`; replace 20 hardcoded URLs
- [x] `next.config.ts` `remotePatterns` -> localhost:5000

## Phase 2 — Schema rename + missing fields

- [x] `product.model`: `name`->`title`, `stock`->`quantity`, `subCategory`->`subcategory[]`;
      add `imageCover`, `priceAfterDiscount`, `ratingsAverage`, `ratingsQuantity`, `sold`
- [x] `category.model` / `brand.model`: `logo`->`image`; brand `category` becomes optional
- [x] `user.model`: `firstName`/`lastName` -> `name`; add `isVerified`
- [x] Propagate renames through every DTO, service, filter, and test

## Phase 3 — Response envelope & public reads

- [x] Route-compatible envelope: `{ status, results, metadata, data }` on public GETs
- [x] `GET /subcategories` (backend models these as `Category` with `parentCategory`)
- [x] Product list filtering/sort/pagination to match the frontend grid + search

## Phase 4 — Auth compatibility

- [x] `AuthGuard` accepts the frontend's `token:` header alongside `Authorization: Bearer`
- [x] `POST /auth/signup` accepts `{name, email, password, rePassword, phone}`, returns token + sends verify email
- [x] `POST /auth/signin` returns `{message:'success', user:{name,email,role}, token}`
- [x] 3-step reset to match the existing UI: `forgotPasswords` -> `verifyResetCode` -> `resetPassword` (PUT)
- [x] Frontend register page: auto sign-in instead of redirecting to `/login`

## Phase 5 — Cart & wishlist

- [x] Cart response reshaped to `{status, numOfCartItems, cartId, data:{cartOwner, products:[{count, price, product}], totalCartPrice}}`
- [x] Routes: `POST /cart`, `GET /cart`, `PUT /cart/:productId {count}`, `DELETE /cart/:productId`, `DELETE /cart`
- [x] Wishlist returns fully populated product objects; `POST /wishlist`, `GET /wishlist`, `DELETE /wishlist/:productId`

## Phase 6 — Orders & checkout

- [x] `POST /orders/checkout-session/:cartId?url=` -> Stripe session, returns `{status, session:{url}}`
- [ ] Webhook creates the order, clears the cart, increments `sold`

## Phase 7 — Reviews & ratings

- [x] Recompute `ratingsAverage` / `ratingsQuantity` on review create/delete

## Phase 8 — Seeding

- [x] Seed script: admin user, categories, subcategories, brands, products, reviews
- [x] Rewrite captured image URLs to local `/uploads/seed/...`
- [x] Reviews generated to reproduce the original `ratingsAverage` / `ratingsQuantity`

## Phase 9 — Verification

- [x] Boot both apps; walked home, products, product detail, categories, brands, cart,
      wishlist, checkout, login, register, verifycode, resetpassword — all render from our API
- [x] Verified through the UI: login, add-to-cart (correct discounted unit price), session ->
      backend token chain, next/image serving backend uploads
- [ ] Stripe checkout submit (creates a real order + Stripe session) - left for you to trigger

## Phase 10 — Ship

- [ ] Root `.gitignore` (node_modules, .next, dist, config/*.env, runtime uploads)
- [ ] `git init` at repo root, single monorepo commit
- [ ] Push to `github.com/mostafanabil11/E-commerce.git` (**confirm the username** — the old
      remotes were both under `mostafanabil725`)

## Notes / risks

- `Backend/config/dev.env` holds live **MongoDB Atlas** credentials. It is correctly gitignored,
  but the URI was printed to this terminal during review — consider rotating that password.
- Redis is not running locally; caching paths must tolerate its absence.
- Only `uploads/seed/` should be committed; runtime uploads stay ignored.
