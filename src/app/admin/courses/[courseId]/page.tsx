import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
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
    <Suspense fallback={<main className="p-6">読み込み中...</main>}>
      <AdminCourseContent params={params} />
    </Suspense>
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
    <AdminShell>
      <h1 className="text-2xl font-semibold">講座の編集</h1>
      <div className="flex max-w-2xl flex-col gap-6">
        <CourseStatusControl courseId={course.id} status={course.status} />
        <CourseForm course={course} />
        <div className="mt-2 border-t border-foreground/10 pt-4">
          <DeleteCourseButton courseId={course.id} />
        </div>
      </div>
    </AdminShell>
  );
}
