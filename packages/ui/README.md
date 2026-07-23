# `@repo/ui`

Shared [shadcn/ui](https://ui.shadcn.com/docs/monorepo) package for this Turborepo.

```txt
src/
  components/        # shared UI primitives (button, input, …)
  hooks/             # shared hooks from the registry
  lib/utils.ts       # cn()
  styles/globals.css # design tokens + Tailwind entry
components.json      # CLI config for this package
```

Apps that consume this package also have their own `components.json` (`apps/web`, `apps/docs`) so the CLI knows where to put UI vs app-only blocks.

---

## Guide: add a new component with shadcn

### 1. Run `add` from an **app** workspace

Always run the CLI from the app that will use the component (usually `web`). Do **not** run it from the monorepo root unless you pass `-c`.

```sh
# from repo root
bunx --bun shadcn@latest add button -c apps/web -y

# or from the app
cd apps/web
bunx --bun shadcn@latest add button -y
```

Use the same `style` / `baseColor` / `iconLibrary` as in `components.json` (`base-nova`, `neutral`, `lucide`).

### 2. What gets installed where

| What you add | Lands in |
| --- | --- |
| UI primitive (`button`, `input`, `dialog`, …) | `packages/ui/src/components/` |
| Hook / util from registry | `packages/ui/src/hooks/` or `packages/ui/src/lib/` |
| Block / page piece (`login-01`, form composed of UI) | `apps/web/components/` (app-local) |

Examples:

```sh
# shared button → packages/ui/src/components/button.tsx
bunx --bun shadcn@latest add button -c apps/web -y

# several primitives at once
bunx --bun shadcn@latest add label input card -c apps/web -y

# block: primitives go to @repo/ui, login-form stays in the app
bunx --bun shadcn@latest add login-01 -c apps/web -y
```

### 3. Overwrite an existing component

```sh
bunx --bun shadcn@latest add button -c apps/web -y -o
```

`-o` / `--overwrite` replaces the file in `packages/ui`. Review the diff before committing.

### 4. Install any new package deps

If the CLI reports missing packages (e.g. `@base-ui/react`), install them on **`@repo/ui`**:

```sh
bun add <dependency> --cwd packages/ui
```

### 5. Import in apps

```tsx
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
```

CSS is already wired in apps via:

```css
@import "@repo/ui/globals.css";
```

(`apps/web/app/globals.css`, `apps/docs/app/globals.css`)

### 6. Docs zone

`apps/docs` has its own `components.json` pointing at the same `@repo/ui`. After adding a shared component from `web`, import it the same way in docs—no second `add` needed for primitives.

To add a **docs-only** block:

```sh
bunx --bun shadcn@latest add [block] -c apps/docs -y
```

---

## Useful flags

| Flag | Meaning |
| --- | --- |
| `-y` | Skip prompts |
| `-o` | Overwrite existing files |
| `-c <path>` | App cwd (`apps/web` / `apps/docs`) |
| `--dry-run` | Preview without writing |

Browse components: [ui.shadcn.com](https://ui.shadcn.com/docs/components)

---

## Requirements (don’t break the CLI)

1. Keep `components.json` in **both** `packages/ui` and each app (`web`, `docs`).
2. Keep `style`, `iconLibrary`, and `baseColor` **identical** across those files.
3. Tailwind v4: leave `"tailwind.config": ""` empty.
4. Package exports in `package.json` must stay aligned with aliases:

```json
{
  "exports": {
    "./globals.css": "./src/styles/globals.css",
    "./components/*": "./src/components/*.tsx",
    "./lib/*": "./src/lib/*.ts",
    "./hooks/*": "./src/hooks/*.ts"
  }
}
```
