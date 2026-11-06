import "server-only";
import { and, asc, count, desc, eq, gt, inArray, lt, max } from "drizzle-orm";
import { db, type DbClient } from "@/db";
import { courses, lessons, sections } from "@/db/schema";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { asRecord, parseTitle } from "@/lib/validation";
import {
  InvalidYoutubeUrlError,
  parseYoutubeVideoId,
} from "@/lib/youtube-url";

type MoveDirection = "up" | "down";

const LAST_LESSON_MESSAGE =
  "公開中のコースのレッスンをなくすことはできません。先に下書きへ戻してください。";

function parseVideoId(value: unknown): string {
  try {
    if (typeof value !== "string") {
      throw new InvalidYoutubeUrlError();
    }
    return parseYoutubeVideoId(value);
  } catch (error) {
    if (error instanceof InvalidYoutubeUrlError) {
      throw new ValidationError(error.message);
    }
    throw error;
  }
}

function parseDirection(input: unknown): MoveDirection {
  const { direction } = asRecord(input);
  if (direction !== "up" && direction !== "down") {
    throw new ValidationError("並び替えの方向が正しくありません。");
  }
  return direction;
}

async function findSection(client: DbClient, sectionId: string) {
  const [section] = await client
    .select()
    .from(sections)
    .where(eq(sections.id, sectionId));
  if (!section) {
    throw new NotFoundError("セクションが見つかりません。");
  }
  return section;
}

async function findLesson(client: DbClient, lessonId: string) {
  const [lesson] = await client
    .select()
    .from(lessons)
    .where(eq(lessons.id, lessonId));
  if (!lesson) {
    throw new NotFoundError("レッスンが見つかりません。");
  }
  return lesson;
}

async function isCoursePublished(client: DbClient, courseId: string) {
  const [course] = await client
    .select({ status: courses.status })
    .from(courses)
    .where(eq(courses.id, courseId));
  return course?.status === "published";
}

/** コース全体のレッスン数を返す。 */
export async function countCourseLessons(client: DbClient, courseId: string) {
  const [{ total }] = await client
    .select({ total: count() })
    .from(lessons)
    .innerJoin(sections, eq(lessons.sectionId, sections.id))
    .where(eq(sections.courseId, courseId));
  return total;
}

/** コースのセクションとレッスンを、並び順で返す。 */
export async function getCurriculum(courseId: string) {
  const courseSections = await db
    .select()
    .from(sections)
    .where(eq(sections.courseId, courseId))
    .orderBy(asc(sections.position));

  const sectionLessons =
    courseSections.length === 0
      ? []
      : await db
          .select()
          .from(lessons)
          .where(
            inArray(
              lessons.sectionId,
              courseSections.map((section) => section.id),
            ),
          )
          .orderBy(asc(lessons.position));

  return courseSections.map((section) => ({
    ...section,
    lessons: sectionLessons.filter((lesson) => lesson.sectionId === section.id),
  }));
}

export async function createSection(courseId: string, input: unknown) {
  const title = parseTitle(asRecord(input).title);

  const [course] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.id, courseId));
  if (!course) {
    throw new NotFoundError("コースが見つかりません。");
  }

  const [{ lastPosition }] = await db
    .select({ lastPosition: max(sections.position) })
    .from(sections)
    .where(eq(sections.courseId, courseId));

  const [section] = await db
    .insert(sections)
    .values({
      id: crypto.randomUUID(),
      courseId,
      title,
      position: (lastPosition ?? 0) + 1,
    })
    .returning();
  return section;
}

export async function updateSection(sectionId: string, input: unknown) {
  const record = asRecord(input);
  if (!("title" in record)) {
    return findSection(db, sectionId);
  }

  const [section] = await db
    .update(sections)
    .set({ title: parseTitle(record.title) })
    .where(eq(sections.id, sectionId))
    .returning();
  if (!section) {
    throw new NotFoundError("セクションが見つかりません。");
  }
  return section;
}

export async function deleteSection(sectionId: string) {
  await db.transaction(async (tx) => {
    const section = await findSection(tx, sectionId);

    if (await isCoursePublished(tx, section.courseId)) {
      const [{ inSection }] = await tx
        .select({ inSection: count() })
        .from(lessons)
        .where(eq(lessons.sectionId, sectionId));
      const total = await countCourseLessons(tx, section.courseId);
      if (inSection > 0 && total === inSection) {
        throw new ConflictError(LAST_LESSON_MESSAGE);
      }
    }

    await tx.delete(sections).where(eq(sections.id, sectionId));
  });
}

export async function moveSection(sectionId: string, input: unknown) {
  const direction = parseDirection(input);

  await db.transaction(async (tx) => {
    const section = await findSection(tx, sectionId);
    const [neighbor] = await tx
      .select()
      .from(sections)
      .where(
        and(
          eq(sections.courseId, section.courseId),
          direction === "up"
            ? lt(sections.position, section.position)
            : gt(sections.position, section.position),
        ),
      )
      .orderBy(
        direction === "up" ? desc(sections.position) : asc(sections.position),
      )
      .limit(1);
    if (!neighbor) {
      return;
    }

    await tx
      .update(sections)
      .set({ position: neighbor.position })
      .where(eq(sections.id, section.id));
    await tx
      .update(sections)
      .set({ position: section.position })
      .where(eq(sections.id, neighbor.id));
  });
}

export async function createLesson(sectionId: string, input: unknown) {
  const record = asRecord(input);
  const title = parseTitle(record.title);
  const youtubeVideoId = parseVideoId(record.youtubeUrl);

  await findSection(db, sectionId);

  const [{ lastPosition }] = await db
    .select({ lastPosition: max(lessons.position) })
    .from(lessons)
    .where(eq(lessons.sectionId, sectionId));

  const [lesson] = await db
    .insert(lessons)
    .values({
      id: crypto.randomUUID(),
      sectionId,
      title,
      youtubeVideoId,
      position: (lastPosition ?? 0) + 1,
    })
    .returning();
  return lesson;
}

export async function updateLesson(lessonId: string, input: unknown) {
  const record = asRecord(input);
  const fields: { title?: string; youtubeVideoId?: string } = {};
  if ("title" in record) {
    fields.title = parseTitle(record.title);
  }
  if ("youtubeUrl" in record) {
    fields.youtubeVideoId = parseVideoId(record.youtubeUrl);
  }

  if (Object.keys(fields).length === 0) {
    return findLesson(db, lessonId);
  }

  const [lesson] = await db
    .update(lessons)
    .set(fields)
    .where(eq(lessons.id, lessonId))
    .returning();
  if (!lesson) {
    throw new NotFoundError("レッスンが見つかりません。");
  }
  return lesson;
}

export async function deleteLesson(lessonId: string) {
  await db.transaction(async (tx) => {
    const lesson = await findLesson(tx, lessonId);
    const section = await findSection(tx, lesson.sectionId);

    if (
      (await isCoursePublished(tx, section.courseId)) &&
      (await countCourseLessons(tx, section.courseId)) === 1
    ) {
      throw new ConflictError(LAST_LESSON_MESSAGE);
    }

    await tx.delete(lessons).where(eq(lessons.id, lessonId));
  });
}

export async function moveLesson(lessonId: string, input: unknown) {
  const direction = parseDirection(input);

  await db.transaction(async (tx) => {
    const lesson = await findLesson(tx, lessonId);
    const [neighbor] = await tx
      .select()
      .from(lessons)
      .where(
        and(
          eq(lessons.sectionId, lesson.sectionId),
          direction === "up"
            ? lt(lessons.position, lesson.position)
            : gt(lessons.position, lesson.position),
        ),
      )
      .orderBy(
        direction === "up" ? desc(lessons.position) : asc(lessons.position),
      )
      .limit(1);
    if (!neighbor) {
      return;
    }

    await tx
      .update(lessons)
      .set({ position: neighbor.position })
      .where(eq(lessons.id, lesson.id));
    await tx
      .update(lessons)
      .set({ position: lesson.position })
      .where(eq(lessons.id, neighbor.id));
  });
}
