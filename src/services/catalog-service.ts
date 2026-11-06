import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses } from "@/db/schema";

/** 受講者向けに、公開中の講座の一覧を返す。 */
export async function listPublishedCourses() {
  return db
    .select({
      id: courses.id,
      title: courses.title,
      thumbnailFileName: courses.thumbnailFileName,
      youtubeVideoId: courses.youtubeVideoId,
    })
    .from(courses)
    .where(eq(courses.status, "published"))
    .orderBy(desc(courses.createdAt));
}

/** 視聴用の講座を返す。下書きや存在しない講座は null を返す。 */
export async function getCourseForViewing(courseId: string) {
  const [course] = await db
    .select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      youtubeVideoId: courses.youtubeVideoId,
    })
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.status, "published")));
  return course ?? null;
}
