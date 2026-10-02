# Authentication setup

The API owns authentication and Resend email delivery. Next.js forwards `/api/auth/*`
requests to NestJS on the server, so the browser uses same-origin requests and an
HttpOnly session cookie. Passwords, database access, and Resend credentials remain
on the API server. Authentication accounts are stored in `auth_users`. The
`remove_tutorial_users` migration drops the obsolete `users` table and its data.

## Structure

```text
apps/api/src/
  auth/       Routes, validation, password hashing, sessions, reset flow, guards
  database/   Shared Drizzle client and connection lifecycle
  mail/       Resend API client and password reset emails
  config/     Environment helpers
apps/web/
  app/(auth)/ Login, signup, forgot-password, reset-password pages
  app/api/auth/[action]/ Server-side API proxy
  app/dashboard/        Session-protected account page
  components/auth/      Reusable forms and logout button
packages/database/src/db/auth-schema.ts
  auth_users, auth_sessions, password_reset_tokens
```

## Environment

Set the following in `apps/api/.env` (see `.env.example`):

```dotenv
DATABASE_URL=postgresql://user:password@localhost:5432/logistics
APP_URL=http://localhost:3000
PORT=3002
API_ORIGIN=http://localhost:3002
RESEND_API_KEY=
RESEND_FROM=
```

Do not overwrite an existing `.env`; merge these keys into it. The existing
database URL was added to the API environment during setup if it was missing.
The Resend fields are intentionally empty for later credential insertion. Create
an API key in the Resend dashboard, verify your sending domain, then set
`RESEND_API_KEY=re_...` and `RESEND_FROM=Logistics <no-reply@your-domain.com>`.
Restart the API after changing these values. See the official
[Resend Node.js guide](https://resend.com/docs/send-with-nodejs).
Email delivery uses Resend's HTTPS API. The API can start with empty credentials;
password reset delivery requires both fields. Signup and login remain available.

Set `API_URL=http://localhost:3002` in `apps/web/.env.local` if necessary. This is a
server-only variable; the browser never needs the API URL. Database migration
commands use `packages/database/.env`, not the API's environment file.

In production set `NODE_ENV=production`, use an HTTPS `APP_URL`, and provide the
Resend credentials through the deployment's environment variables. Production
cookies are Secure. Environment files are
ignored by Git. Resend failures are logged by the API; password recovery still
returns a generic response to prevent account enumeration.

## Run

From the repository root:

```powershell
pnpm install
pnpm --filter database build
pnpm --filter database db:migrate
pnpm dev
```

The authentication migration has already been generated and applied to the local
database during setup. Other databases must apply the checked-in migrations.
Turbo builds the database package before its API consumer. The database `dev`
script only watches and compiles changes; it does not perform migrations.

Open http://localhost:3000/signup to create a new account. Signup signs you in.
Forgot password sends a link to `/reset-password?token=...`. Passwords must have
12–128 characters. Reset links expire after 30 minutes and can be used once. A
successful reset revokes all sessions and other reset tokens for that account;
it does not automatically sign the user in.

## API routes

| Method | Route                   | Body / purpose                                             |
| ------ | ----------------------- | ---------------------------------------------------------- |
| POST   | `/auth/signup`          | `{ name, email, password }`                                |
| POST   | `/auth/login`           | `{ email, password }`                                      |
| GET    | `/auth/me`              | Requires session cookie                                    |
| POST   | `/auth/logout`          | Revokes current session and clears cookie                  |
| POST   | `/auth/forgot-password` | `{ email }`; always returns a generic message              |
| POST   | `/auth/reset-password`  | `{ token, password }`; consumes token and revokes sessions |

Browser clients use the corresponding `/api/auth/...` proxy routes. Mutating
browser requests must send JSON from the configured origin. Future protected
API controllers should import `AuthModule`, use `@UseGuards(SessionGuard)`, and
read the authenticated user from `AuthenticatedRequest.user`. Protect backend
data endpoints even when their web pages are also protected.

## Validation

```powershell
pnpm --filter database check-types
pnpm --filter api test
pnpm --filter api build
pnpm --filter api test:auth:integration
pnpm --filter web lint
pnpm --filter web check-types
pnpm --filter web build
```

The integration test requires a development PostgreSQL connection with permission
to create a temporary schema. It creates an isolated schema, applies the auth SQL
there, exercises the actual HTTP API with a captured email provider, and removes
only that temporary schema afterward. It never sends external email or modifies
existing application tables. It covers reset expiry, concurrent token reuse, old
password rejection, session revocation, and logout. Mail service unit tests cover
Resend request payloads, missing credentials, returned API errors, and network
failures using a mocked SDK. Tests do not require Resend credentials.

## Operational notes

- Passwords are salted and hashed using Node's scrypt; session/reset tokens are
  cryptographically random and only SHA-256 hashes are stored in PostgreSQL.
- Session lifetime is seven days. Expired sessions and reset tokens cannot be
  used; periodically remove their expired rows as database maintenance.
- Request throttling is process-local and scopes limits to IP plus account/session,
  with a bulk IP limit. For multiple API instances, move this to a shared rate-limit
  store or configure equivalent limits at your ingress.
- This implements signup, login, and password recovery. Email verification, MFA,
  organization roles, and shipment authorization are separate future features.
- The sample query demonstration was replaced by a reusable `createDatabase`
  factory. Consumers must create a client once and close its pool at shutdown.
