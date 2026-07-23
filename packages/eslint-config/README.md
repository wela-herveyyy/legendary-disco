# `@repo/eslint-config`

Shared ESLint configs for this monorepo.

## Initial setup

1. Install monorepo deps (`bun install`) — apps/packages already list this as a workspace dependency.

2. In an app or package, point ESLint at the shared config:

`eslint.config.js`

```js
import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default nextJsConfig;
```

For a non-Next library, use the base / react configs exported from this package (see `package.json` `exports`).

3. Run lint from the app:

```sh
bun run lint --filter=web
# or
bun run --cwd apps/web lint
```

No env vars or publish step — workspace package only.
