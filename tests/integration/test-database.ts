import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "@/db";
import {
  account,
  courses,
  lessonProgress,
  lessons,
  sections,
  session,
  user,
  verification,
} from "@/db/schema";

/** テスト用DBを最新のテーブル構成にして、中身を空にする。 */
export async function resetTestDatabase() {
  await migrate(db, { migrationsFolder: "drizzle" });

  await db.delete(lessonProgress);
  await db.delete(lessons);
  await db.delete(sections);
  await db.delete(courses);
  await db.delete(session);
  await db.delete(account);
  await db.delete(verification);
  await db.delete(user);
}
