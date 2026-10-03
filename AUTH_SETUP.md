# Neon authentication and database setup

Neon Auth (managed Better Auth) owns accounts, password hashing, sessions,
verification emails, and password recovery. Its tables live in the managed
neon_auth schema. NestJS uses Neon Postgres through the shared Drizzle package
and verifies Neon JWTs for protected API requests.

## Request flow

The browser calls the same-origin Next.js /api/auth/* handler through
@neondatabase/auth. The Next.js SDK manages secure session cookies and proxies
to the configured Neon Auth URL. Signup, login, email verification, password
reset, and logout use the managed SDK methods.

The dashboard checks the session, obtains a JWT with auth.token(), and calls
NestJS /auth/me. NestJS verifies signature, expiry, issuer, and audience, then
reads the managed account and rejects missing or banned users. Neon uses the
Auth URL's origin for JWT issuer and audience, while the JWKS URL includes
/neondb/auth/.well-known/jwks.json.

File requests use Next.js /api/files, which obtains a JWT server-side and
forwards it to protected NestJS storage routes. The API uploads to the configured
Neon private bucket, isolates objects under uploads/{userId}/, and generates
five-minute download URLs only for that user's files. Uploads are limited to
10 MB. Bucket credentials stay on the API server.

## Environment

Merge apps/api/.env.example into apps/api/.env and apps/web/.env.example into
apps/web/.env.local. Existing values should be retained. The API and web app
must use the same Neon Auth branch; the database and storage must also target
that branch.

- API: DATABASE_URL (pooled), NEON_AUTH_BASE_URL, AWS_ENDPOINT_URL_S3,
  AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, and S3_BUCKET.
- Web: API_URL, NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET (random, at least
  32 characters).
- Database tooling: packages/database/.env uses the direct DATABASE_URL, or
  DATABASE_URL_UNPOOLED when specified. The API accepts DATABASE_URL_POOLED
  as an optional runtime override.

Use the full JWKS path /.well-known/jwks.json if setting NEON_AUTH_JWKS_URL.
S3_BUCKET must match the bucket actually provisioned on the branch; the sample
assets bucket is not automatically created. No application Resend client is
required. Email delivery and trusted redirect domains are configured in Neon.
Register deployed web origins in Neon Auth's trusted domains. Localhost must
be allowed for development.

The custom auth implementation and mailer are removed from the active app.
Historical SQL is retained under packages/database/legacy-drizzle for reference
and is excluded from the active Drizzle migration directory. Do not apply it
to Neon or migrate/drop Neon-managed auth tables. Existing custom accounts are
not automatically transferred; users need Neon accounts.

## Run and verify

From the repository root:

    pnpm --filter database build
    pnpm --filter api build
    pnpm dev

Open http://localhost:3000/signup. Create an account, verify the email code
if requested, sign in, reload the dashboard, upload/download a file, and sign
out. Password recovery starts at /forgot-password and returns to
/reset-password?token=... using the managed email link.

    pnpm --filter database check-types
    pnpm --filter api test
    pnpm --filter api check-types
    pnpm --filter api test:auth:integration
    pnpm --filter api test:docs:integration
    pnpm --filter web lint
    pnpm --filter web check-types
    pnpm --filter web build

JWT unit and HTTP integration tests generate local Ed25519 keys and serve a
local JWKS endpoint. They cover valid identity, invalid/expired tokens, wrong
issuer/audience, anonymous identities, missing/banned accounts, and HTTP guards.
They do not create production users, send email, or modify Neon tables.
Sign-out ends the browser session; an already issued JWT remains valid until
expiry (typically 15 minutes).

References:
- https://neon.com/docs/auth/guides/plugins/jwt
- https://neon.com/docs/auth/overview
- https://neon.com/docs/storage/s3-compatibility
