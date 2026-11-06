import { Suspense } from "react";
import { CourseCard, CourseCardGrid } from "@/components/course/course-card";
import { requireUser } from "@/lib/session";
import { listPublishedCourses } from "@/services/catalog-service";
import { getProgressSummary } from "@/services/progress-service";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6">
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
      <CourseCardGrid>
        {courses.map((course) => {
          const completed = completedIds.has(course.id);
          return (
            <CourseCard
              key={course.id}
              href={`/courses/${course.id}`}
              ariaLabel={
                completed ? `${course.title}（視聴済み）` : course.title
              }
              course={course}
              footer={completed ? "視聴済み" : undefined}
            />
          );
        })}
      </CourseCardGrid>
    </>
  );
}
