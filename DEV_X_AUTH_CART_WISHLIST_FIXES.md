# Dev-X Book Store — Auth / Cart / Wishlist Fixes

## Fixed in this revision

1. **Local HTTP authentication/session bug**
   - Session cookies are no longer marked `Secure` when the browser is using plain HTTP on localhost.
   - This prevents the common issue where registration appears to work but the session disappears immediately, forcing the user to create a new account repeatedly.
   - HTTPS production remains Secure when the request is actually HTTPS.

2. **Login and registration forms**
   - Added stable field IDs.
   - Replaced fragile positional input selection with explicit selectors.
   - Added duplicate-submit protection.

3. **Cart**
   - Cart remains server-side and tied to the authenticated PostgreSQL/SQLite user.
   - Authentication state is restored through `/api/auth/me`.
   - Frontend refresh no longer throws away a valid authenticated state just because a secondary cart/wishlist request has a transient failure.

4. **Wishlist hearts**
   - Static product-card hearts are now clickable.
   - They resolve the exact product through its image key, toggle the server-side wishlist, and visually switch to an active state.

5. **Regression tests**
   - Smoke tests now verify:
     - HTTP session cookie is not incorrectly marked Secure
     - login works after registration
     - session cookie is usable over HTTP
     - existing cart persistence/wishlist/order tests still pass

## Verification

- `node --check backend/server.js` — PASS
- `node --check frontend/js/main.js` — PASS
- Smoke tests — PASS (40 checks)
- Security tests — PASS (10 checks)

Total automated checks: **50**.

## Important local `.env` note

For plain `http://localhost:3000`, it is still recommended to use:

`NODE_ENV=development`
`COOKIE_SECURE=false`

Never put database passwords or Paymob secrets into this documentation or source archive.
