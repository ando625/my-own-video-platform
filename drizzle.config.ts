import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// drizzle-kit は Next.js の外で動くため、.env.local を明示的に読み込む。
loadEnvConfig(process.cwd());

const url = process.env.TURSO_DATABASE_URL;

if (!url) {
  throw new Error("環境変数 TURSO_DATABASE_URL が設定されていません。");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url,
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  },
});
