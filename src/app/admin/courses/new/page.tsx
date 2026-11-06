import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { CourseForm } from "@/components/admin/course-form";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "新規作成",
  robots: { index: false, follow: false },
};

export default function NewCoursePage() {
  return (
    <Suspense fallback={<main className="p-6">読み込み中...</main>}>
      <NewCourseContent />
    </Suspense>
  );
}

async function NewCourseContent() {
  await requireAdmin();

  return (
    <AdminShell>
      <h1 className="text-2xl font-semibold">新規作成</h1>
      <div className="max-w-2xl">
        <CourseForm />
      </div>
    </AdminShell>
  );
}
