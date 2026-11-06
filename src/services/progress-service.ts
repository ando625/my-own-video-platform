import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { courseProgress, courses } from "@/db/schema";
import { summarizeProgress } from "@/lib/course-progress";
import { NotFoundError } from "@/lib/errors";

async function assertPublishedCourse(courseId: string) {
  const [course] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.status, "published")));
  if (!course) {
    throw new NotFoundError("講座が見つかりません。");
  }
}

export async function markCourseCompleted(userId: string, courseId: string) {
  await assertPublishedCourse(courseId);
  await db
    .insert(courseProgress)
    .values({ userId, courseId, completedAt: new Date() })
    .onConflictDoNothing();
}

export async function unmarkCourseCompleted(userId: string, courseId: string) {
  await assertPublishedCourse(courseId);
  await db
    .delete(courseProgress)
    .where(
      and(
        eq(courseProgress.userId, userId),
        eq(courseProgress.courseId, courseId),
      ),
    );
}

export async function isCourseCompleted(userId: string, courseId: string) {
  const [row] = await db
    .select({ courseId: courseProgress.courseId })
    .from(courseProgress)
    .where(
      and(
        eq(courseProgress.userId, userId),
        eq(courseProgress.courseId, courseId),
      ),
    );
  return Boolean(row);
}

/** 公開中の講座についての、ユーザーの進捗を集計する。 */
export async function getProgressSummary(userId: string) {
  const publishedCourses = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.status, "published"));
  const completedRows = await db
    .select({ courseId: courseProgress.courseId })
    .from(courseProgress)
    .innerJoin(courses, eq(courseProgress.courseId, courses.id))
    .where(
      and(eq(courseProgress.userId, userId), eq(courses.status, "published")),
    );
  const completedCourseIds = completedRows.map((row) => row.courseId);

  return {
    ...summarizeProgress(
      publishedCourses.map((course) => course.id),
      completedCourseIds,
    ),
    completedCourseIds,
  };
}
