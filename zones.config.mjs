/**
 * Child Multi-Zones proxied by `apps/web`.
 * Lives at the repo root so it stays in git even when `apps/` is ignored.
 * Prefer `bun run create-zone` over editing this by hand.
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
  {
    name: "docs",
    basePath: "/docs",
    assetPrefix: "/docs-static",
    port: 3001,
    envKey: "DOCS_URL",
  },
];

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {{ source: string, destination: string }[]}
 */
export function rewritesFromZones(env = process.env) {
  return zones.flatMap(({ basePath, assetPrefix, envKey, port }) => {
    const origin = env[envKey] ?? `http://localhost:${port}`;
    return [
      {
        source: basePath,
        destination: `${origin}${basePath}`,
      },
      {
        source: `${basePath}/:path+`,
        destination: `${origin}${basePath}/:path+`,
      },
      {
        source: `${assetPrefix}/:path+`,
        destination: `${origin}${assetPrefix}/:path+`,
      },
    ];
  });
}
