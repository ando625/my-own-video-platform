import { mkdirSync } from "node:fs";
import { assertTestDatabase } from "./assert-test-database";

assertTestDatabase(process.env.TURSO_DATABASE_URL);
mkdirSync(".test", { recursive: true });
