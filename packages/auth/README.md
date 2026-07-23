# `@repo/auth`

Shared [Better Auth](https://www.better-auth.com) + Drizzle (`provider: "pg"`) on `@repo/db`.

## Setup

1. Auth tables must exist in Neon (already pushed once). Sync with `bun run db:pull`.
2. In `apps/web/.env.local`:

```env
DATABASE_URL=...
BETTER_AUTH_SECRET=   # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

API is on the **web** zone: `/api/auth/*`.

## Usage

```ts
import { auth } from "@repo/auth";
import { authClient, useSession } from "@repo/auth/client";
```
