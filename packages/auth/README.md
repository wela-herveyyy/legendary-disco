# `@repo/auth`

Shared [Better Auth](https://www.better-auth.com) with the Drizzle adapter (`provider: "pg"`) on `@repo/db`.

## Initial setup

1. Finish [`@repo/db`](../db/README.md) setup first (`DATABASE_URL` + auth tables pushed).

2. Ensure auth columns exist (including `company_name` on `user`):

```sh
bun run db:push
```

3. Create / restore the **web** app if needed (`bun run create-zone`), then set env in `apps/web/.env.local`:

```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=          # openssl rand -base64 32  (≥ 32 chars)
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

4. Mount the handler on the web zone (once):

`apps/web/app/api/auth/[...all]/route.ts`

```ts
import { auth } from "@repo/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

5. Use in UI:

```ts
import { authClient, useSession } from "@repo/auth/client";
```

API base path: `/api/auth/*` on the main zone only.

## Custom user fields

Extra fields (e.g. `companyName`) are declared in `src/auth.ts` under `user.additionalFields` and mirrored in `packages/db/src/schema/auth/tables.ts`. The client uses `inferAdditionalFields` in `src/client.ts`.
