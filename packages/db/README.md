# `@repo/db`

Shared Drizzle + Neon Postgres client. **The database is the source of truth.**

## Layout

```
src/schema/
  auth/
    tables.ts      # user, session, account, verification
    relations.ts
  index.ts         # re-exports every domain
```

Add a domain as `src/schema/<name>/tables.ts` (and `relations.ts` when needed), then export it from `src/schema/index.ts`.

## Setup

1. Copy `.env.example` → `.env` and set `DATABASE_URL`.
2. Apply or sync schema:

```sh
bun run db:push   # apply local schema to Neon (use carefully)
bun run db:pull   # introspect Neon → review before merging into schema/
```

`pull` writes into `drizzle/` / kit output — move tables into the matching `schema/<name>/tables.ts` folder; do not keep a flat `schema.ts`.

## Auth tables

Better Auth tables live under `schema/auth/`. After changing auth plugins, push the new columns, then update `tables.ts`.

## Usage

```ts
import { db, user } from "@repo/db";
```
