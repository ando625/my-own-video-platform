import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { isValidThumbnailFileName } from "@/lib/course-thumbnail";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { asRecord, parseTitle } from "@/lib/validation";
import {
  InvalidYoutubeUrlError,
  parseYoutubeVideoId,
} from "@/lib/youtube-url";

const COURSE_NOT_FOUND = "講座が見つかりません。";

type CourseFields = {
  title?: string;
  description?: string | null;
  youtubeVideoId?: string;
  thumbnailFileName?: string | null;
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

function parseThumbnailFileName(value: unknown): string | null {
  if (value === null || value === "") {
    return null;
  }
  if (typeof value !== "string" || !isValidThumbnailFileName(value)) {
    throw new ValidationError(
      "サムネイルのファイル名は、英数字と . _ - で入力してください（png、jpg、jpeg、webp）。",
    );
  }
  return value;
}

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

/** 修正できる項目だけを取り出す。status は専用の操作でだけ変更する。 */
function parseCourseFields(record: Record<string, unknown>): CourseFields {
  const fields: CourseFields = {};
  if ("title" in record) {
    fields.title = parseTitle(record.title);
  }
  if ("description" in record) {
    fields.description = parseDescription(record.description);
  }
  if ("youtubeUrl" in record) {
    fields.youtubeVideoId = parseVideoId(record.youtubeUrl);
  }
  if ("thumbnailFileName" in record) {
    fields.thumbnailFileName = parseThumbnailFileName(record.thumbnailFileName);
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
    throw new NotFoundError(COURSE_NOT_FOUND);
  }
  return course;
}

export async function createCourse(input: unknown) {
  const record = asRecord(input);
  const fields = parseCourseFields(record);
  const title = parseTitle(record.title);
  const youtubeVideoId = parseVideoId(record.youtubeUrl);

  const [course] = await db
    .insert(courses)
    .values({ ...fields, id: crypto.randomUUID(), title, youtubeVideoId })
    .returning();
  return course;
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
    throw new NotFoundError(COURSE_NOT_FOUND);
  }
  return course;
}

async function setCourseStatus(courseId: string, status: "draft" | "published") {
  const [course] = await db
    .update(courses)
    .set({ status })
    .where(eq(courses.id, courseId))
    .returning();
  if (!course) {
    throw new NotFoundError(COURSE_NOT_FOUND);
  }
  return course;
}

export async function publishCourse(courseId: string) {
  return setCourseStatus(courseId, "published");
}

export async function unpublishCourse(courseId: string) {
  return setCourseStatus(courseId, "draft");
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
