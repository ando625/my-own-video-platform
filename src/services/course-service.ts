import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { asRecord, parseTitle } from "@/lib/validation";
import { countCourseLessons } from "./curriculum-service";

const THUMBNAIL_PATH_PATTERN = /^\/thumbnails\/[A-Za-z0-9._-]+$/;
const COURSE_NOT_FOUND = "コースが見つかりません。";

type CourseFields = {
  title?: string;
  description?: string | null;
  thumbnailPath?: string | null;
};

function parseDescription(value: unknown): string | null {
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    throw new ValidationError("説明の形式が正しくありません。");
  }
  return value.trim() || null;
}

function parseThumbnailPath(value: unknown): string | null {
  if (value === null || value === "") {
    return null;
  }
  if (
    typeof value !== "string" ||
    !THUMBNAIL_PATH_PATTERN.test(value) ||
    value.includes("..")
  ) {
    throw new ValidationError(
      "サムネイルは /thumbnails/ から始まる場所を入力してください。",
    );
  }
  return value;
}

/** 修正できる項目だけを取り出す。status は公開の条件を通すため受け付けない。 */
function parseCourseFields(record: Record<string, unknown>): CourseFields {
  const fields: CourseFields = {};
  if ("title" in record) {
    fields.title = parseTitle(record.title);
  }
  if ("description" in record) {
    fields.description = parseDescription(record.description);
  }
  if ("thumbnailPath" in record) {
    fields.thumbnailPath = parseThumbnailPath(record.thumbnailPath);
  }
  return fields;
}

export async function listCourses() {
  return db.select().from(courses).orderBy(desc(courses.createdAt));
}

export async function getCourse(courseId: string) {
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId));
  if (!course) {
    throw new NotFoundError("コースが見つかりません。");
  }
  return course;
}

export async function createCourse(input: unknown) {
  const record = asRecord(input);
  const fields = parseCourseFields(record);
  const title = parseTitle(record.title);

  const [course] = await db
    .insert(courses)
    .values({ ...fields, id: crypto.randomUUID(), title })
    .returning();
  return course;
}

export async function publishCourse(courseId: string) {
  return db.transaction(async (tx) => {
    const [course] = await tx
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.id, courseId));
    if (!course) {
      throw new NotFoundError(COURSE_NOT_FOUND);
    }
    if ((await countCourseLessons(tx, courseId)) === 0) {
      throw new ConflictError("レッスンが1本以上あるコースだけを公開できます。");
    }

    const [published] = await tx
      .update(courses)
      .set({ status: "published" })
      .where(eq(courses.id, courseId))
      .returning();
    return published;
  });
}

export async function unpublishCourse(courseId: string) {
  const [course] = await db
    .update(courses)
    .set({ status: "draft" })
    .where(eq(courses.id, courseId))
    .returning();
  if (!course) {
    throw new NotFoundError(COURSE_NOT_FOUND);
  }
  return course;
}

export async function deleteCourse(courseId: string) {
  const [course] = await db
    .delete(courses)
    .where(eq(courses.id, courseId))
    .returning({ id: courses.id });
  if (!course) {
    throw new NotFoundError(COURSE_NOT_FOUND);
  }
}

export async function updateCourse(courseId: string, input: unknown) {
  const fields = parseCourseFields(asRecord(input));
  if (Object.keys(fields).length === 0) {
    return getCourse(courseId);
  }

  const [course] = await db
    .update(courses)
    .set(fields)
    .where(eq(courses.id, courseId))
    .returning();
  if (!course) {
    throw new NotFoundError("コースが見つかりません。");
  }
  return course;
}
