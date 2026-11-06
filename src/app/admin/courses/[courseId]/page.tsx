import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CourseSettings } from "@/components/admin/course-settings";
import { CurriculumEditor } from "@/components/admin/curriculum-editor";
import { NotFoundError } from "@/lib/errors";
import { requireAdmin } from "@/lib/session";
import { getCourse } from "@/services/course-service";
import { getCurriculum } from "@/services/curriculum-service";

export const metadata: Metadata = {
  title: "コースの編集",
  robots: { index: false, follow: false },
};

export default function AdminCoursePage({
  params,
}: PageProps<"/admin/courses/[courseId]">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-6">
      <Suspense fallback={<p>読み込み中...</p>}>
        <AdminCourseContent params={params} />
      </Suspense>
    </main>
  );
}

async function loadCourse(courseId: string) {
  try {
    return await getCourse(courseId);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }
}

async function AdminCourseContent({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  await requireAdmin();
  const { courseId } = await params;
  const course = await loadCourse(courseId);
  const sections = await getCurriculum(courseId);

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link
          href="/admin"
          className="text-sm underline-offset-4 hover:underline"
        >
          コース一覧へ戻る
        </Link>
        <h1 className="text-2xl font-semibold">コースの編集</h1>
      </div>
      <CourseSettings course={course} />
      <CurriculumEditor courseId={course.id} sections={sections} />
    </>
  );
}
