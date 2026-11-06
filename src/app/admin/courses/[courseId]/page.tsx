import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CourseForm } from "@/components/admin/course-form";
import { CourseStatusControl } from "@/components/admin/course-status-control";
import { DeleteCourseButton } from "@/components/admin/delete-course-button";
import { NotFoundError } from "@/lib/errors";
import { requireAdmin } from "@/lib/session";
import { getCourse } from "@/services/course-service";

export const metadata: Metadata = {
  title: "講座の編集",
  robots: { index: false, follow: false },
};

export default function AdminCoursePage({
  params,
}: PageProps<"/admin/courses/[courseId]">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
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

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link
          href="/admin"
          className="text-sm underline-offset-4 hover:underline"
        >
          講座一覧へ戻る
        </Link>
        <h1 className="text-2xl font-semibold">講座の編集</h1>
      </div>
      <CourseStatusControl courseId={course.id} status={course.status} />
      <CourseForm course={course} />
      <div className="mt-2 border-t border-foreground/10 pt-4">
        <DeleteCourseButton courseId={course.id} />
      </div>
    </>
  );
}
