import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { courses, lessonProgress, lessons, sections, user } from "@/db/schema";
import { resetTestDatabase } from "./test-database";

const USER_ID = "user-1";

/** 1つのコースに、セクションを1つ、レッスンを2本、それぞれの進捗を作る。 */
async function createCourse(id: string) {
  await db.insert(courses).values({ id, title: `コース ${id}` });
  await db.insert(sections).values({
    id: `${id}-section`,
    courseId: id,
    title: "セクション",
    position: 1,
  });
  for (const position of [1, 2]) {
    const lessonId = `${id}-lesson-${position}`;
    await db.insert(lessons).values({
      id: lessonId,
      sectionId: `${id}-section`,
      title: `レッスン ${position}`,
      youtubeVideoId: "dQw4w9WgXcQ",
      position,
    });
    await db.insert(lessonProgress).values({
      userId: USER_ID,
      lessonId,
      completedAt: new Date(),
    });
  }
}

async function countRows() {
  return {
    courses: (await db.select().from(courses)).length,
    sections: (await db.select().from(sections)).length,
    lessons: (await db.select().from(lessons)).length,
    progress: (await db.select().from(lessonProgress)).length,
  };
}

describe("削除時に配下のデータも消える", () => {
  beforeEach(async () => {
    await resetTestDatabase();
    await db.insert(user).values({
      id: USER_ID,
      name: "受講者",
      email: "member@example.com",
    });
    await createCourse("target");
    await createCourse("other");
  });

  it("IT-020: コースを削除すると配下のセクション、レッスン、進捗も消える", async () => {
    await db.delete(courses).where(eq(courses.id, "target"));

    expect(await countRows()).toEqual({
      courses: 1,
      sections: 1,
      lessons: 2,
      progress: 2,
    });
    const remaining = await db.select().from(lessons);
    expect(remaining.every((lesson) => lesson.id.startsWith("other-"))).toBe(
      true,
    );
  });

  it("IT-021: セクションを削除すると配下のレッスン、進捗も消える", async () => {
    await db.delete(sections).where(eq(sections.id, "target-section"));

    expect(await countRows()).toEqual({
      courses: 2,
      sections: 1,
      lessons: 2,
      progress: 2,
    });
    const remaining = await db.select().from(lessons);
    expect(remaining.every((lesson) => lesson.id.startsWith("other-"))).toBe(
      true,
    );
  });

  it("IT-022: レッスンを削除すると該当の進捗も消え、全体のレッスン数が減る", async () => {
    await db.delete(lessons).where(eq(lessons.id, "target-lesson-1"));

    const targetLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.sectionId, "target-section"));
    expect(targetLessons.map((lesson) => lesson.id)).toEqual([
      "target-lesson-2",
    ]);

    const progress = await db.select().from(lessonProgress);
    expect(progress).toHaveLength(3);
    expect(progress.map((row) => row.lessonId)).not.toContain(
      "target-lesson-1",
    );
  });
});
