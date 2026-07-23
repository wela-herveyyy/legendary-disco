# `@repo/typescript-config`

Shared `tsconfig` bases for apps and packages.

## Initial setup

1. Install monorepo deps (`bun install`).

2. Extend the right base in your package/app `tsconfig.json`:

**Next.js app**

```json
{
  "extends": "@repo/typescript-config/nextjs.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "strictNullChecks": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] }
  },
  "include": ["**/*.ts", "**/*.tsx", "next-env.d.ts", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**React library** (e.g. `@repo/ui`)

```json
{
  "extends": "@repo/typescript-config/react-library.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**Generic package**

```json
{
  "extends": "@repo/typescript-config/base.json"
}
```

3. Typecheck:

```sh
bun run check-types
```

No env vars — configs are JSON only.
