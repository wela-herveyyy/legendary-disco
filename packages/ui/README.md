# `@repo/ui`

Shared [shadcn/ui](https://ui.shadcn.com/docs/monorepo) package (Tailwind v4, `base-nova`).

## Initial setup

1. Install monorepo deps:

```sh
bun install
```

2. In each Next app that uses UI, import the shared CSS once (usually `app/globals.css`):

```css
@import "@repo/ui/globals.css";

@source ".";
@source "../components";
```

3. Ensure the app has Tailwind PostCSS:

`postcss.config.mjs`

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

4. Keep `components.json` in both `packages/ui` and the app (`apps/web`, …) with the **same** `style` / `baseColor` / `iconLibrary`.

5. Import primitives:

```tsx
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
```

No extra publish step — apps depend on `"@repo/ui": "*"`.

## Layout

```
src/
  components/        # button, input, card, …
  hooks/
  lib/utils.ts       # cn()
  styles/globals.css # tokens + Tailwind entry
components.json
```

## Add a component (shadcn)

Always run the CLI from an **app** (or pass `-c`):

```sh
bunx --bun shadcn@latest add button -c apps/web -y
bunx --bun shadcn@latest add label input card -c apps/web -y
```

| What you add | Lands in |
| --- | --- |
| UI primitive | `packages/ui/src/components/` |
| Hook / util | `packages/ui/src/hooks/` or `lib/` |
| Page block | `apps/<app>/components/` |

If the CLI needs a new dependency:

```sh
bun add <dependency> --cwd packages/ui
```

Overwrite an existing file with `-o`. Browse: [ui.shadcn.com](https://ui.shadcn.com/docs/components).
