import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": fileURLToPath(
        new URL("./tests/empty-module.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    setupFiles: ["tests/vitest-setup.ts"],
    // 結合テストは同じテスト用DBを使うので、ファイルを順番に実行する。
    fileParallelism: false,
    env: {
      TURSO_DATABASE_URL: "file:.test/vitest.db",
      TURSO_AUTH_TOKEN: "",
      BETTER_AUTH_URL: "http://localhost:3000",
      BETTER_AUTH_SECRET: "vitest-only-secret-not-used-in-production-0",
      GOOGLE_CLIENT_ID: "vitest-google-client-id",
      GOOGLE_CLIENT_SECRET: "vitest-google-client-secret",
      ADMIN_EMAIL: "admin@example.com",
    },
  },
});
