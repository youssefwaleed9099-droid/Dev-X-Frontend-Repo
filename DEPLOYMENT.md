# Dev-X Book Store — Production Go-Live Runbook

This project is prepared for a real production deployment. The remaining steps that cannot be completed inside the source archive require ownership of external services: a PostgreSQL account, a public domain/DNS account, a hosting account, and Paymob merchant credentials/approval.

## Recommended simplest stack

- Hosting: Render Web Service using the included `Dockerfile` / `render.yaml`.
- Database: Render PostgreSQL for the simplest same-provider setup. Neon is also supported by `DATABASE_URL` if preferred.
- HTTPS/domain: Render Custom Domain (automatic TLS) or Caddy on your own VPS.
- Payments: Paymob Unified Checkout + webhook/HMAC.

Render supports Docker-based web services, custom domains, TLS, health checks, and PostgreSQL. See the official docs linked in the project README.

## Step 1 — Create the production database

### Option A: Render PostgreSQL (recommended for this project)
1. Create a Render account.
2. Create a PostgreSQL database.
3. Keep the database and web service in the same region.
4. Render provides an internal connection string. Use it as `DATABASE_URL` for the web service.
5. Do not paste the password into Git or source files.

### Option B: Neon
1. Create a Neon PostgreSQL project.
2. Create the production database.
3. Copy the pooled PostgreSQL connection string from the dashboard.
4. Set it as `DATABASE_URL`.
5. Keep `DATABASE_SSL=true`.

## Step 2 — Verify PostgreSQL before deployment

On a machine with Node.js installed:

```bash
npm install
npm run db:check
```

PowerShell:

```powershell
$env:DATABASE_URL="YOUR_REAL_POSTGRES_CONNECTION_STRING"
$env:DATABASE_SSL="true"
npm.cmd run db:check
```

Expected output starts with:

`POSTGRESQL CONNECTION OK`

Never send the real connection string, password, or Paymob secrets in chat.

## Step 3 — Deploy the application

### Render
1. Put this project in a private GitHub repository.
2. In Render, create a new Blueprint/Service from the repository.
3. The included `render.yaml` creates the web service and PostgreSQL database configuration.
4. Add the Paymob secrets as Render environment variables.
5. Deploy.
6. Wait for `/api/ready` to become healthy.
7. Open the generated `onrender.com` URL and test the full site.

### VPS + Caddy alternative
Use `docker-compose.prod.yml`, set `DOMAIN`, configure DNS A/AAAA to the VPS, expose ports 80/443, and run:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Caddy then obtains/renews the TLS certificate automatically.

## Step 4 — Configure Paymob TEST first

Do not start with live credentials.

Set these environment variables:

- `PAYMOB_SECRET_KEY`
- `PAYMOB_PUBLIC_KEY`
- `PAYMOB_CARD_INTEGRATION_ID`
- `PAYMOB_WALLET_INTEGRATION_ID` if wallets are enabled
- `PAYMOB_HMAC_SECRET`
- `PAYMOB_NOTIFICATION_URL=https://YOUR-DOMAIN/api/payments/paymob/webhook`
- `PAYMOB_REDIRECT_URL=https://YOUR-DOMAIN/payment-result`

Test both a successful and failed transaction. Confirm the webhook reaches the public endpoint and that invalid HMAC requests are rejected.

Only after Paymob approves the merchant for production should TEST values be replaced by LIVE values.

## Step 5 — Add the real domain

For Render:
1. Add the domain under the service's Custom Domains.
2. Follow the DNS records Render gives you.
3. Verify the domain.
4. Confirm both root and `www` behavior.
5. Confirm `https://YOUR-DOMAIN/api/health` returns HTTP 200.
6. Confirm HTTP redirects to HTTPS.

For Caddy/VPS:
1. Create an A record pointing to the VPS public IP.
2. Add AAAA only if IPv6 is correctly configured.
3. Open TCP ports 80 and 443.
4. Set `DOMAIN=YOUR-DOMAIN`.
5. Start the production compose file.

## Step 6 — Final production QA

Run these tests against the real HTTPS domain, not localhost:

### Availability
- Home page loads.
- `/api/health` = 200.
- `/api/ready` = 200.
- No mixed-content browser warnings.

### Account
- Register.
- Login.
- Logout.
- Session survives page refresh.
- One user's orders/addresses/cart cannot be read by another user.

### Store
- Categories.
- Search.
- Product details.
- Add/remove/update cart.
- Wishlist.
- Address.
- Branch pickup.
- Delivery.
- Stock cannot become negative.

### Orders
- COD order.
- Card order.
- Wallet order if enabled.
- Order appears in the user's account.
- Cart clears after order creation.
- Payment failure does not leave stock permanently deducted.

### Payment security
- Successful Paymob payment updates the order only through a valid webhook.
- Failed payment becomes `failed`.
- Replayed webhook does not duplicate the payment event.
- Invalid HMAC returns 401.

### Browser/device QA
Test Chrome/Edge on desktop and Chrome/Safari on mobile where available. Test at least one small phone viewport and one desktop viewport.

### Security
- HTTPS only.
- Session cookie is Secure + HttpOnly + SameSite.
- No secrets appear in page source, JavaScript bundle, logs, or Git.
- Direct access to private APIs without login returns 401.
- Large request bodies are rejected.
- Path traversal attempts are rejected.

## Production acceptance gate

The project is considered fully live only when all of these are true:

- [ ] Real PostgreSQL connection succeeds.
- [ ] Production schema/seed completed.
- [ ] Hosting deployment is healthy.
- [ ] Custom domain resolves.
- [ ] HTTPS certificate is valid.
- [ ] Paymob TEST transaction succeeds and fails correctly.
- [ ] Paymob webhook/HMAC verified.
- [ ] Paymob LIVE account is approved.
- [ ] LIVE credentials configured on the server only.
- [ ] One real end-to-end LIVE transaction is completed and reconciled.
- [ ] Final browser QA passes on the production URL.
- [ ] Backup and restore procedure is confirmed for the production database.
