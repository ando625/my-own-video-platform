import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CoursePlayer } from "@/components/course/course-player";
import { requireUser } from "@/lib/session";
import { getCourseForViewing } from "@/services/catalog-service";
import { isCourseCompleted } from "@/services/progress-service";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CoursePage({
  params,
}: PageProps<"/courses/[courseId]">) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <Suspense fallback={<p>読み込み中...</p>}>
        <CourseContent params={params} />
      </Suspense>
    </main>
  );
}

async function CourseContent({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  // 動画IDを読み込む前に、必ずログインを確認する。
  const user = await requireUser();
  const { courseId } = await params;
  const course = await getCourseForViewing(courseId);
  if (!course) {
    notFound();
  }
  const completed = await isCourseCompleted(user.id, course.id);

  return (
    <>
      <Link href="/" className="text-sm underline-offset-4 hover:underline">
        講座一覧へ戻る
      </Link>
      <h1 className="text-2xl font-semibold">{course.title}</h1>
      {course.description && <p>{course.description}</p>}
      <CoursePlayer
        courseId={course.id}
        title={course.title}
        youtubeVideoId={course.youtubeVideoId}
        initialCompleted={completed}
      />
    </>
  );
}
