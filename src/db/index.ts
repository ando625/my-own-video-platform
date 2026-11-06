import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.TURSO_DATABASE_URL;

if (!url) {
  throw new Error("環境変数 TURSO_DATABASE_URL が設定されていません。");
}

const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

export const db = drizzle(client, { schema });

/** 通常の接続とトランザクションの、どちらでも使える処理のための型。 */
export type DbClient =
  | typeof db
  | Parameters<Parameters<typeof db.transaction>[0]>[0];
