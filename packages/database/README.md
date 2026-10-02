# Database

Shared PostgreSQL package for the logistics API, using Drizzle ORM.

```typescript
import { createDatabase, authUsers } from "database";

const { db, pool } = createDatabase(process.env.DATABASE_URL!);
const users = await db.select({ id: authUsers.id, name: authUsers.name }).from(authUsers);
```

Create one client per application and call `pool.end()` when it shuts down.
The NestJS `DatabaseService` handles that lifecycle. Importing the package does
not execute queries or load environment variables.

Run commands from the repository root:

```powershell
pnpm --filter database build
pnpm --filter database db:generate --name describe_change
pnpm --filter database db:migrate
```

Set migration credentials in `packages/database/.env`. Review and commit generated
migration files. The `dev` script watches TypeScript source; migrations are run
explicitly. Accounts are stored in `auth_users`. The `remove_tutorial_users`
migration drops the obsolete tutorial `users` table and its data; existing
authentication accounts are retained. See [authentication setup](../../AUTH_SETUP.md)
for application configuration.
