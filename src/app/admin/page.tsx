import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { CourseCard, CourseCardGrid } from "@/components/course/course-card";
import { requireAdmin } from "@/lib/session";
import { listCourses } from "@/services/course-service";

export const metadata: Metadata = {
  title: "管理画面",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <Suspense fallback={<main className="p-6">読み込み中...</main>}>
      <AdminContent />
    </Suspense>
  );
}

async function AdminContent() {
  await requireAdmin();
  const courses = await listCourses();

  return (
    <AdminShell>
      <h1 className="text-2xl font-semibold">管理画面</h1>
      <h2 className="text-lg font-semibold">講座一覧</h2>
      {courses.length === 0 ? (
        <p className="text-sm text-foreground/60">講座はまだありません。</p>
      ) : (
        <CourseCardGrid>
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              href={`/admin/courses/${course.id}`}
              ariaLabel={course.title}
              course={course}
              footer={course.status === "published" ? "公開中" : "下書き"}
            />
          ))}
        </CourseCardGrid>
      )}
    </AdminShell>
  );
}
