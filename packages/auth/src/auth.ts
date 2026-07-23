import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db, schemaWithRelations } from "@repo/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schemaWithRelations,
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      companyName: {
        type: "string",
        required: true,
        input: true,
      },
    },
  },
  experimental: {
    joins: true,
  },
});
