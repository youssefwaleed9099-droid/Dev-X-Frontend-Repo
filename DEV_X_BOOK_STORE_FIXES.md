# Dev-X Book Store — Functional Fixes

## Fixed

- Product details now resolve by the product's unique `image_key` through `/api/products/by-image-key/:key`; the frontend no longer searches by visible text or falls back to the first result.
- Add-to-cart from static product cards uses the same exact product lookup, preventing the wrong product from being added.
- Server-side cart persistence was verified against the database; cart state is reloaded from `/api/cart` after authentication and survives refreshes.
- Added secure password-reset flow:
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
  - one-time SHA-256 token storage
  - 15-minute expiration
  - reset invalidates existing sessions
  - local requests expose a reset token for testing without requiring an email provider
- Added PostgreSQL and SQLite schema support for password-reset tokens.
- Updated local scripts to load `.env` using Node's `--env-file=.env`.
- Expanded automated smoke coverage to 37 checks, including exact product lookup, cart persistence, password reset, new-password login, and single-use reset-token behavior.

## Verification

- `node --check backend/server.js` — PASS
- `node --check frontend/js/main.js` — PASS
- `node backend/tests/smoke.js` — PASS (37 checks)
- `node backend/tests/security.js` — PASS (10 checks)
- Static product image-key audit — PASS (100 product keys, 0 missing/duplicate keys)
- Manual API verification of product lookup and password reset — PASS

## Not included

- No payment-provider secret was added.
- No database credentials were added to the archive.
- No hosting/deployment changes are required to use this fixed local build.
- Actual Paymob live payment cannot be verified without merchant credentials and provider approval.
