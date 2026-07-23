import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set (see packages/db/.env)");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/schema/**/*.ts",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
