# Database

Shared Neon Postgres package for the logistics API, using Drizzle ORM and pg.

```typescript
import { createDatabase } from "database";
import { sql } from "drizzle-orm";

const { db, pool } = createDatabase(process.env.DATABASE_URL!);
await db.execute(sql`select 1`);
```

Create one client per application and call pool.end() when it shuts down.
NestJS DatabaseService handles that lifecycle. Importing this package does not
load environment variables or run queries.

The API uses the pooled Neon connection. Migration commands load
packages/database/.env and use DATABASE_URL_UNPOOLED if set, otherwise
DATABASE_URL; use the direct connection for those commands.

    pnpm --filter database build
    pnpm --filter database db:generate --name describe_change
    pnpm --filter database db:migrate

The active schema contains application-owned tables only (currently empty).
Neon owns the neon_auth schema; do not generate or apply migrations for its
tables. Custom auth migrations are archived under legacy-drizzle and excluded
from the active migration directory. Existing custom accounts do not become
Neon Auth accounts automatically.

See [authentication setup](../../AUTH_SETUP.md) for configuration and validation.
