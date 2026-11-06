import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/session";
import { listPublishedCourses } from "@/services/catalog-service";
import { getProgressSummary } from "@/services/progress-service";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">講座一覧</h1>
      <Suspense fallback={<p>読み込み中...</p>}>
        <CourseList />
      </Suspense>
    </main>
  );
}

async function CourseList() {
  const user = await requireUser();
  const [courses, progress] = await Promise.all([
    listPublishedCourses(),
    getProgressSummary(user.id),
  ]);

  if (courses.length === 0) {
    return <p className="text-foreground/60">公開中の講座はまだありません。</p>;
  }

  const completedIds = new Set(progress.completedCourseIds);

  return (
    <>
      <p className="text-sm text-foreground/70">
        {progress.total}本中{progress.completed}本 視聴済み
      </p>
      <ul className="flex flex-col gap-3">
        {courses.map((course) => {
          const completed = completedIds.has(course.id);
          return (
            <li
              key={course.id}
              aria-label={completed ? `${course.title}（視聴済み）` : course.title}
              className="flex flex-col gap-1 rounded-md border border-foreground/10 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/courses/${course.id}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {course.title}
                </Link>
                {completed && (
                  <span className="shrink-0 text-sm text-foreground/60">
                    視聴済み
                  </span>
                )}
              </div>
              {course.description && (
                <p className="text-sm text-foreground/70">
                  {course.description}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
