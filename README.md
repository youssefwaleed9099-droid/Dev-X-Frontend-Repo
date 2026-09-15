# Dev-X Book Store — Production Build

Full-stack e-commerce backup upgraded for production deployment. The project supports a managed PostgreSQL database, Paymob hosted checkout/webhooks, Docker deployment, HTTPS through Caddy or managed hosting, environment-based secrets, security hardening, and automated integration/security tests.

## Requirements
- Node.js 22.5+

## Local development
```bash
npm install
npm start
```
Open `http://localhost:3000`. SQLite remains available for local development and automated tests.

## Production
Production mode intentionally refuses to start without `DATABASE_URL`; SQLite is disabled in `NODE_ENV=production`. The recommended easiest deployment is Render using the included `render.yaml`, with Render PostgreSQL. Neon is also supported through the standard PostgreSQL `DATABASE_URL`.

### Database connection check
```bash
npm run db:check
```
This command requires the real `DATABASE_URL`. Never commit or share that value.

### Test
```bash
npm run check
npm run test:all
```
The automated suites use isolated SQLite test databases unless a dedicated PostgreSQL test environment is intentionally supplied.

Current verified local results:
- Smoke/integration: 31 checks passed.
- Security: 10 checks passed.
- JavaScript syntax checks: passed.

## API
- GET `/api/health`
- GET `/api/ready`
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/logout`
- GET `/api/auth/me`
- GET `/api/products`
- GET `/api/products/:id`
- GET `/api/categories`
- GET `/api/branches`
- GET/POST `/api/cart` / `/api/cart/items`
- PATCH/DELETE `/api/cart/items/:id`
- GET/POST `/api/wishlist`
- DELETE `/api/wishlist/:productId`
- GET/POST `/api/addresses`
- GET/POST `/api/orders`
- GET `/api/account`
- POST `/api/payments/paymob/webhook`

## Production deployment files
- `render.yaml` — Render web service + PostgreSQL blueprint.
- `Dockerfile` — production container.
- `docker-compose.prod.yml` — VPS + Caddy deployment.
- `Caddyfile` — automatic HTTPS reverse proxy.
- `.env.example` — required environment variable names; no secrets.
- `backend/database/backend/database/schema.postgres.sql` — PostgreSQL schema reference.
- `DEPLOYMENT.md` — step-by-step go-live runbook.

## Payment
Paymob is integrated at code level using the Intention API, hosted Unified Checkout, a backend webhook, and HMAC verification. Live transactions still require the merchant's Paymob account, business/technical approval, and live credentials. Paymob's documentation states that live credentials are issued after account setup, paperwork, contract/risk review, integration testing, and technical approval.

## Important
A source archive cannot itself create external accounts, buy a domain, issue live payment credentials, or prove a production server works. Those external steps must be completed by the project owner/team. Once the real PostgreSQL URL, domain/DNS, hosting service, and Paymob credentials are configured, the final QA must be run against the real HTTPS URL.
