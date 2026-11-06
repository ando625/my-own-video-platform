import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CourseForm } from "@/components/admin/course-form";
import { requireAdmin } from "@/lib/session";
import { listCourses } from "@/services/course-service";

export const metadata: Metadata = {
  title: "管理画面",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-6">
      <Suspense fallback={<p>読み込み中...</p>}>
        <AdminContent />
      </Suspense>
    </main>
  );
}

async function AdminContent() {
  await requireAdmin();
  const courses = await listCourses();

  return (
    <>
      <h1 className="text-2xl font-semibold">管理画面</h1>
      <CourseForm />
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">講座一覧</h2>
        {courses.length === 0 ? (
          <p className="text-sm text-foreground/60">講座はまだありません。</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {courses.map((course) => (
              <li
                key={course.id}
                className="flex items-center justify-between gap-3 rounded-md border border-foreground/10 p-3"
              >
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="underline-offset-4 hover:underline"
                >
                  {course.title}
                </Link>
                <span className="text-sm text-foreground/60">
                  {course.status === "published" ? "公開中" : "下書き"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
