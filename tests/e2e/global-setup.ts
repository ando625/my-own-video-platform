import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { session, user } from "../../src/db/auth-schema";
import {
  courses,
  lessonProgress,
  lessons,
  sections,
} from "../../src/db/course-schema";
import { assertTestDatabase } from "../assert-test-database";
import { E2E_ENV, E2E_USERS } from "./test-env";

export default async function globalSetup() {
  assertTestDatabase(E2E_ENV.TURSO_DATABASE_URL);

  const client = createClient({ url: E2E_ENV.TURSO_DATABASE_URL });
  try {
    const db = drizzle(client);
    await migrate(db, { migrationsFolder: "drizzle" });

    await db.delete(lessonProgress);
    await db.delete(lessons);
    await db.delete(sections);
    await db.delete(courses);
    await db.delete(session);
    await db.delete(user);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    for (const testUser of Object.values(E2E_USERS)) {
      await db.insert(user).values({
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      });
      await db.insert(session).values({
        id: `${testUser.id}-session`,
        token: testUser.sessionToken,
        userId: testUser.id,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      });
    }
  } finally {
    client.close();
  }
}
