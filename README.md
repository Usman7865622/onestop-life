# Platform: Phase 1A (backend foundation)

NestJS + Prisma + PostgreSQL (PostGIS) + Redis. Phone-OTP login, JWT access tokens with rotating
refresh tokens, role-based access, professional/seller verification queue, product catalogue,
local cart, order checkout, discounts, COD, payment records, and admin refunds.

## Prerequisites
Node 20+, pnpm 9 (`corepack enable`), Docker.

## First run
```bash
pnpm install
cp apps/api/.env.example apps/api/.env      # then replace both secrets: openssl rand -base64 48
docker compose up -d                         # Postgres + Redis
cd apps/api

# 1) create the migration WITHOUT applying it
pnpm exec prisma migrate dev --name init --create-only

# 2) open prisma/migrations/<timestamp>_init/migration.sql and append this at the end:
#    CREATE UNIQUE INDEX "verification_requests_one_pending_per_type"
#    ON "verification_requests" ("userId", "type") WHERE "status" = 'PENDING';

# 3) apply it, then create the first admin (uses ADMIN_PHONE from .env)
pnpm exec prisma migrate dev
pnpm exec prisma db seed

pnpm start:dev                               # API on http://localhost:4000
pnpm test                                    # unit tests
```

## Try it
```bash
# 1. request a code (in development it is printed in the API console)
curl -i -X POST localhost:4000/auth/otp/request -H 'Content-Type: application/json' \
  -d '{"phone":"03001234567"}'

# 2. verify it; the refresh token is set as an httpOnly cookie
curl -i -c cookies.txt -X POST localhost:4000/auth/otp/verify -H 'Content-Type: application/json' \
  -d '{"phone":"03001234567","code":"123456"}'

# 3. call a protected route
TOKEN=<accessToken from step 2>
curl localhost:4000/users/me -H "Authorization: Bearer $TOKEN"

# 4. rotate the session
curl -b cookies.txt -c cookies.txt -X POST localhost:4000/auth/refresh

# 5. apply to become a doctor (as a normal user)
curl -X POST localhost:4000/verification-requests -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"type":"DOCTOR","licenseNumber":"12345-P","licenseAuthority":"PMDC","documentKey":"licences/demo.pdf"}'

# 6. as admin (the seeded ADMIN_PHONE), list and approve
curl "localhost:4000/admin/verification-requests?status=PENDING" -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X POST localhost:4000/admin/verification-requests/<id>/approve -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' -d '{"note":"Licence checked"}'

# 7. create an order (the web storefront does this automatically)
curl -X POST localhost:4000/orders -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"productId":"<product-id>","quantity":1}],"shippingName":"A Customer","shippingPhone":"03001234567","shippingAddress":"Lahore","discountCode":"WELCOME10","paymentMethod":"COD"}'

# 8. list the signed-in customer's orders
curl localhost:4000/orders/mine -H "Authorization: Bearer $TOKEN"
```

## Before production
- Implement `SmsProvider` with a real Pakistani SMS provider (the app refuses to start in production
  with the console provider).
- Replace `CardProvider` with a credentialed Stripe, Safepay, JazzCash, or Easypaisa adapter and
  implement its signed webhook before accepting live card or wallet payments. The current card
  option is deliberately local test mode and never moves real money.
- Connect the refund service to the selected gateway's refund API before issuing live refunds.
- Set `COOKIE_SECURE=true`, real secrets, `TRUST_PROXY=true` only if behind a reverse proxy.
- Serve web and API on the same registrable domain (app.example.pk / api.example.pk) because the
  refresh cookie is `SameSite=Lax`.
