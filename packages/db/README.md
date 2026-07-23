# `@repo/db`

Shared [Drizzle](https://orm.drizzle.team/) + [Neon](https://neon.tech/) Postgres client. **The database is the source of truth.**

## Initial setup

1. From the monorepo root, install deps (if you haven’t):

```sh
bun install
```

2. Copy env and set your Neon connection string:

```sh
cp packages/db/.env.example packages/db/.env
```

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

3. Push the local schema (auth tables, etc.) to Neon, or pull if the DB already has tables:

```sh
bun run db:push    # local schema → Neon
bun run db:pull    # Neon → review into schema/<name>/
bun run db:studio  # optional browser UI
```

4. Use in an app:

```ts
import { db, user } from "@repo/db";
```

Apps need `DATABASE_URL` in their own env too (e.g. `apps/web/.env.local`) because the client reads `process.env.DATABASE_URL` at runtime.

## Layout

```
src/schema/
  auth/
    tables.ts      # user, session, account, verification
    relations.ts
  index.ts         # re-exports every domain
```

Add a domain as `src/schema/<name>/tables.ts` (+ `relations.ts` when needed), then export it from `src/schema/index.ts`.

`pull` writes kit output under `drizzle/` — merge into `schema/<name>/tables.ts`; do not keep a flat `schema.ts`.
