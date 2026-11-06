import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { session, user } from "../../src/db/auth-schema";
import { courseProgress, courses } from "../../src/db/course-schema";
import { assertTestDatabase } from "../assert-test-database";
import { E2E_COURSES, E2E_ENV, E2E_USERS, E2E_VIDEO_ID } from "./test-env";

export default async function globalSetup() {
  assertTestDatabase(E2E_ENV.TURSO_DATABASE_URL);

  const client = createClient({ url: E2E_ENV.TURSO_DATABASE_URL });
  try {
    const db = drizzle(client);
    await migrate(db, { migrationsFolder: "drizzle" });

    await db.delete(courseProgress);
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

    for (const course of Object.values(E2E_COURSES)) {
      await db.insert(courses).values({
        ...course,
        youtubeVideoId: E2E_VIDEO_ID,
      });
    }
  } finally {
    client.close();
  }
}
