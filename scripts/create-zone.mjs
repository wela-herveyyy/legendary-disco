#!/usr/bin/env bun
/**
 * Scaffold Next.js Multi-Zone apps under apps/ (often gitignored).
 *
 * Interactive:
 *   bun run create-zone
 *
 * - If apps/web is missing, offers to create the main zone first.
 * - Then can create child zones (docs, blog, …) proxied by web.
 * - Zone registry lives at repo-root zones.config.mjs (tracked in git).
 */

import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const appsDir = path.join(root, "apps");
const webDir = path.join(appsDir, "web");
const zonesPath = path.join(root, "zones.config.mjs");
const envExamplePath = path.join(webDir, ".env.example");

/**
 * @param {import("node:readline/promises").Interface} rl
 * @param {string} question
 * @param {string} [fallback]
 */
async function ask(rl, question, fallback) {
  const hint = fallback !== undefined ? ` (${fallback})` : "";
  const answer = (await rl.question(`${question}${hint}: `)).trim();
  return answer || fallback || "";
}

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

async function write(file, contents) {
  await ensureDir(path.dirname(file));
  await writeFile(file, contents, "utf8");
  console.log(`  + ${path.relative(root, file)}`);
}

function envKeyFor(name) {
  return `${name.replace(/-/g, "_").toUpperCase()}_URL`;
}

function assetPrefixFor(basePath) {
  return `${basePath}-static`;
}

function titleCase(name) {
  return name
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function serializeZones(zones) {
  const body = zones
    .map(
      (z) => `  {
    name: ${JSON.stringify(z.name)},
    basePath: ${JSON.stringify(z.basePath)},
    assetPrefix: ${JSON.stringify(z.assetPrefix)},
    port: ${z.port},
    envKey: ${JSON.stringify(z.envKey)},
  }`,
    )
    .join(",\n");

  return `/**
 * Child Multi-Zones proxied by \`apps/web\`.
 * Lives at the repo root so it stays in git even when \`apps/\` is ignored.
 * Prefer \`bun run create-zone\` over editing this by hand.
 *
 * @typedef {{
 *   name: string,
 *   basePath: string,
 *   assetPrefix: string,
 *   port: number,
 *   envKey: string,
 * }} Zone
 */

/** @type {Zone[]} */
export const zones = [
${body}${body ? "," : ""}
];

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {{ source: string, destination: string }[]}
 */
export function rewritesFromZones(env = process.env) {
  return zones.flatMap(({ basePath, assetPrefix, envKey, port }) => {
    const origin = env[envKey] ?? \`http://localhost:\${port}\`;
    return [
      {
        source: basePath,
        destination: \`\${origin}\${basePath}\`,
      },
      {
        source: \`\${basePath}/:path+\`,
        destination: \`\${origin}\${basePath}/:path+\`,
      },
      {
        source: \`\${assetPrefix}/:path+\`,
        destination: \`\${origin}\${assetPrefix}/:path+\`,
      },
    ];
  });
}
`;
}

async function loadZones() {
  if (!(await exists(zonesPath))) {
    await writeFile(zonesPath, serializeZones([]), "utf8");
    console.log(`  + ${path.relative(root, zonesPath)} (empty registry)`);
    return [];
  }
  const mod = await import(`${pathToFileURL(zonesPath).href}?t=${Date.now()}`);
  return mod.zones ?? [];
}

async function nextPort(zones, preferred) {
  const used = new Set([3000, ...zones.map((z) => z.port)]);
  if (preferred) {
    if (used.has(preferred)) {
      throw new Error(`Port ${preferred} is already used.`);
    }
    return preferred;
  }
  let p = 3001;
  while (used.has(p)) p += 1;
  return p;
}

async function writeSharedAppFiles(appRoot) {
  await write(
    path.join(appRoot, "tsconfig.json"),
    `${JSON.stringify(
      {
        extends: "@repo/typescript-config/nextjs.json",
        compilerOptions: {
          plugins: [{ name: "next" }],
          strictNullChecks: true,
          baseUrl: ".",
          paths: { "@/*": ["./*"] },
        },
        include: [
          "**/*.ts",
          "**/*.tsx",
          "next-env.d.ts",
          "next.config.js",
          ".next/types/**/*.ts",
        ],
        exclude: ["node_modules"],
      },
      null,
      2,
    )}\n`,
  );

  await write(
    path.join(appRoot, "eslint.config.js"),
    `import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default nextJsConfig;
`,
  );

  await write(
    path.join(appRoot, "postcss.config.mjs"),
    `const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
`,
  );

  await write(
    path.join(appRoot, "components.json"),
    `${JSON.stringify(
      {
        $schema: "https://ui.shadcn.com/schema.json",
        style: "base-nova",
        rsc: true,
        tsx: true,
        tailwind: {
          config: "",
          css: "../../packages/ui/src/styles/globals.css",
          baseColor: "neutral",
          cssVariables: true,
        },
        iconLibrary: "lucide",
        aliases: {
          components: "@/components",
          hooks: "@/hooks",
          lib: "@/lib",
          utils: "@repo/ui/lib/utils",
          ui: "@repo/ui/components",
        },
      },
      null,
      2,
    )}\n`,
  );

  await write(
    path.join(appRoot, ".gitignore"),
    `# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# env
.env*

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
`,
  );

  await write(
    path.join(appRoot, "app/globals.css"),
    `@import "@repo/ui/globals.css";

@source ".";
@source "../components";
`,
  );

  await write(
    path.join(appRoot, "app/layout.tsx"),
    `import type { Metadata } from "next";
import { Nunito_Sans, Quicksand } from "next/font/google";
import "./globals.css";

const nunito = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "App",
  description: "Multi-Zone Next.js app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={\`\${nunito.variable} \${quicksand.variable} font-sans antialiased\`}
      >
        {children}
      </body>
    </html>
  );
}
`,
  );
}

async function scaffoldWeb() {
  if (await exists(webDir)) {
    console.error("Error: apps/web already exists.");
    process.exit(1);
  }

  await ensureDir(appsDir);

  await write(
    path.join(webDir, "package.json"),
    `${JSON.stringify(
      {
        name: "web",
        version: "0.1.0",
        type: "module",
        private: true,
        scripts: {
          dev: "next dev --port 3000",
          build: "next build",
          start: "next start",
          lint: "eslint --max-warnings 0",
          "check-types": "next typegen && tsc --noEmit",
        },
        dependencies: {
          "@repo/ui": "*",
          next: "16.2.0",
          react: "^19.2.0",
          "react-dom": "^19.2.0",
        },
        devDependencies: {
          "@repo/eslint-config": "*",
          "@repo/typescript-config": "*",
          "@tailwindcss/postcss": "^4.3.3",
          "@types/node": "^22.15.3",
          "@types/react": "19.2.2",
          "@types/react-dom": "19.2.2",
          eslint: "^9.39.1",
          tailwindcss: "^4.3.3",
          typescript: "5.9.2",
        },
      },
      null,
      2,
    )}\n`,
  );

  await write(
    path.join(webDir, "next.config.js"),
    `import { rewritesFromZones } from "../../zones.config.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui"],
  async rewrites() {
    return rewritesFromZones();
  },
};

export default nextConfig;
`,
  );

  await writeSharedAppFiles(webDir);

  // overwrite layout metadata for web
  await write(
    path.join(webDir, "app/layout.tsx"),
    `import type { Metadata } from "next";
import { Nunito_Sans, Quicksand } from "next/font/google";
import "./globals.css";

const nunito = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Web",
    template: "%s · Web",
  },
  description: "Main Multi-Zone app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={\`\${nunito.variable} \${quicksand.variable} font-sans antialiased\`}
      >
        {children}
      </body>
    </html>
  );
}
`,
  );

  await write(
    path.join(webDir, "app/page.tsx"),
    `export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-4 px-6 py-16">
      <p className="font-display text-xs font-bold tracking-[0.5px] text-primary uppercase">
        Main zone
      </p>
      <h1 className="font-display text-3xl font-bold text-primary">Web</h1>
      <p className="max-w-md text-base leading-7 text-muted-foreground">
        This is the entry Multi-Zone app on port 3000. Child zones are registered
        in <code className="text-foreground">zones.config.mjs</code> and created
        with <code className="text-foreground">bun run create-zone</code>.
      </p>
    </main>
  );
}
`,
  );

  await write(
    envExamplePath,
    `# Child Multi-Zone origins (see ../../zones.config.mjs)
# Example:
# DOCS_URL=http://localhost:3001
`,
  );
}

async function scaffoldChild({ name, basePath, assetPrefix, port }) {
  const appRoot = path.join(appsDir, name);
  if (await exists(appRoot)) {
    console.error(`Error: apps/${name} already exists.`);
    process.exit(1);
  }

  const routeSegment = basePath.slice(1);
  const title = titleCase(name);

  await ensureDir(appsDir);

  await write(
    path.join(appRoot, "package.json"),
    `${JSON.stringify(
      {
        name,
        version: "0.1.0",
        type: "module",
        private: true,
        scripts: {
          dev: `next dev --port ${port}`,
          build: "next build",
          start: `next start --port ${port}`,
          lint: "eslint --max-warnings 0",
          "check-types": "next typegen && tsc --noEmit",
        },
        dependencies: {
          "@repo/ui": "*",
          next: "16.2.0",
          react: "^19.2.0",
          "react-dom": "^19.2.0",
        },
        devDependencies: {
          "@repo/eslint-config": "*",
          "@repo/typescript-config": "*",
          "@tailwindcss/postcss": "^4.3.3",
          "@types/node": "^22.15.3",
          "@types/react": "19.2.2",
          "@types/react-dom": "19.2.2",
          eslint: "^9.39.1",
          tailwindcss: "^4.3.3",
          typescript: "5.9.2",
        },
      },
      null,
      2,
    )}\n`,
  );

  await write(
    path.join(appRoot, "next.config.js"),
    `/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui"],
  // Unique prefix so this zone's assets don't clash with \`web\`
  assetPrefix: ${JSON.stringify(assetPrefix)},
};

export default nextConfig;
`,
  );

  await writeSharedAppFiles(appRoot);

  await write(
    path.join(appRoot, "app/layout.tsx"),
    `import type { Metadata } from "next";
import { Nunito_Sans, Quicksand } from "next/font/google";
import "./globals.css";

const nunito = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "${title}",
  description: "${title} Multi-Zone app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={\`\${nunito.variable} \${quicksand.variable} font-sans antialiased\`}
      >
        {children}
      </body>
    </html>
  );
}
`,
  );

  await write(
    path.join(appRoot, `app/${routeSegment}/page.tsx`),
    `export default function Page() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-4 px-6 py-16">
      <p className="font-display text-xs font-bold tracking-[0.5px] text-primary uppercase">
        Multi-Zone
      </p>
      <h1 className="font-display text-3xl font-bold text-primary">
        ${title}
      </h1>
      <p className="max-w-md text-base leading-7 text-muted-foreground">
        Served at <code className="text-foreground">${basePath}</code> through{" "}
        <code className="text-foreground">web</code>. Use{" "}
        <code className="text-foreground">&lt;a&gt;</code> for cross-zone links,
        not <code className="text-foreground">next/link</code>.
      </p>
      <a
        href="/"
        className="font-display w-fit text-sm font-bold text-primary hover:underline"
      >
        ← Back to main app
      </a>
    </main>
  );
}
`,
  );
}

async function upsertEnvExample(envKey, port) {
  await ensureDir(webDir);
  const line = `${envKey}=http://localhost:${port}`;
  let text = "";
  if (await exists(envExamplePath)) {
    text = await readFile(envExamplePath, "utf8");
    if (text.includes(`${envKey}=`)) {
      text = text.replace(new RegExp(`^${envKey}=.*$`, "m"), line);
      await writeFile(envExamplePath, text, "utf8");
      console.log(`  ~ ${path.relative(root, envExamplePath)} (${envKey})`);
      return;
    }
    if (!text.endsWith("\n")) text += "\n";
    text += `\n# ${envKey.replace(/_URL$/, "")} zone\n${line}\n`;
  } else {
    text = `# Child Multi-Zone origins (see ../../zones.config.mjs)\n${line}\n`;
  }
  await writeFile(envExamplePath, text, "utf8");
  console.log(`  ~ ${path.relative(root, envExamplePath)} (${envKey})`);
}

/**
 * @param {import("node:readline/promises").Interface} rl
 * @param {{ name: string, basePath: string, port: number }[]} zones
 */
async function promptChildZone(rl, zones) {
  let name = "";
  while (!name) {
    name = (await ask(rl, "Child app name (kebab-case)", "docs")).toLowerCase();
    if (!/^[a-z][a-z0-9-]*$/.test(name)) {
      console.log("  → Use kebab-case, e.g. docs or admin-panel.\n");
      name = "";
      continue;
    }
    if (name === "web") {
      console.log('  → "web" is the main zone. Pick another name.\n');
      name = "";
      continue;
    }
    if (zones.some((z) => z.name === name)) {
      console.log(`  → Zone "${name}" is already in zones.config.mjs.\n`);
      name = "";
      continue;
    }
    if (await exists(path.join(appsDir, name))) {
      console.log(`  → Folder apps/${name} already exists.\n`);
      name = "";
    }
  }

  const suggestedPath = `/${name}`;
  let basePath = "";
  while (!basePath) {
    basePath = await ask(rl, "URL path on the main site", suggestedPath);
    if (!basePath.startsWith("/")) basePath = `/${basePath}`;
    if (basePath.length > 1 && basePath.endsWith("/")) {
      basePath = basePath.slice(0, -1);
    }
    if (basePath === "/") {
      console.log("  → Path cannot be /. Use something like /docs.\n");
      basePath = "";
      continue;
    }
    if (zones.some((z) => z.basePath === basePath)) {
      console.log(`  → Path "${basePath}" is already used.\n`);
      basePath = "";
    }
  }

  const suggestedPort = String(await nextPort(zones));
  let port;
  while (port === undefined) {
    const raw = await ask(rl, "Local dev port", suggestedPort);
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 1 || n > 65535) {
      console.log("  → Enter a valid TCP port (1–65535).\n");
      continue;
    }
    if (n === 3000 || zones.some((z) => z.port === n)) {
      console.log(`  → Port ${n} is already taken.\n`);
      continue;
    }
    port = n;
  }

  return {
    name,
    basePath,
    port,
    assetPrefix: assetPrefixFor(basePath),
    envKey: envKeyFor(name),
  };
}

async function main() {
  if (process.argv.includes("-h") || process.argv.includes("--help")) {
    console.log(`
Scaffold Next.js Multi-Zone apps (interactive).

  bun run create-zone

Works even when apps/ is gitignored / missing:
  1. Creates apps/web (main zone) if needed
  2. Creates child zones and registers them in zones.config.mjs
`);
    process.exit(0);
  }

  const rl = createInterface({ input, output });

  try {
    console.log(`
Create a Multi-Zone Next.js app
──────────────────────────────
apps/ can be empty or missing (e.g. gitignored).
Zone registry: zones.config.mjs (tracked at repo root).
`);

    const webExists = await exists(webDir);
    if (!webExists) {
      console.log("No apps/web found — the main zone is required first.\n");
      const createMain = (
        await ask(rl, "Create the main app (apps/web on port 3000)? [Y/n]", "Y")
      ).toLowerCase();
      if (createMain === "n" || createMain === "no") {
        console.log("Cancelled. Need apps/web before adding child zones.");
        process.exit(0);
      }

      console.log("\nCreating main zone apps/web…\n");
      await scaffoldWeb();
      if (!(await exists(zonesPath))) {
        await writeFile(zonesPath, serializeZones([]), "utf8");
        console.log(`  + ${path.relative(root, zonesPath)}`);
      }
      console.log(`
Main app ready at apps/web (http://localhost:3000 after bun install && bun run dev).
`);
    }

    const makeChild = (
      await ask(
        rl,
        webExists
          ? "Create a child zone app? [Y/n]"
          : "Also create a child zone now? [Y/n]",
        "Y",
      )
    ).toLowerCase();

    if (makeChild === "n" || makeChild === "no") {
      console.log(`
Done.

Next steps:
  1. bun install
  2. bun run dev
  3. Open http://localhost:3000
`);
      return;
    }

    const zones = await loadZones();
    const child = await promptChildZone(rl, zones);

    console.log(`
Summary
  apps/${child.name}   child Next.js zone
  path             ${child.basePath}
  assets           ${child.assetPrefix}
  port             ${child.port}
  env              ${child.envKey}=http://localhost:${child.port}
`);

    const confirm = (
      await ask(rl, "Create this child zone? [Y/n]", "Y")
    ).toLowerCase();
    if (confirm === "n" || confirm === "no") {
      console.log("Cancelled.");
      return;
    }

    console.log("\nCreating files…\n");
    await scaffoldChild(child);

    const nextZones = [...zones, child];
    await writeFile(zonesPath, serializeZones(nextZones), "utf8");
    console.log(`  ~ ${path.relative(root, zonesPath)}`);
    await upsertEnvExample(child.envKey, child.port);

    console.log(`
Done — Next.js apps:
  apps/web          main zone  → http://localhost:3000
  apps/${child.name.padEnd(12)} child zone → http://localhost:3000${child.basePath}

Next steps:
  1. bun install
  2. Add ${child.envKey}=http://localhost:${child.port} to apps/web/.env.local
  3. bun run dev

Cross-zone links must use <a href="...">, not next/link.
`);
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
