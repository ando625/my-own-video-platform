"use client";

import { useApiAction } from "@/hooks/use-api-action";
import { apiFetch } from "@/lib/api-client";
import { errorTextClass, secondaryButtonClass } from "./ui";

export function CourseStatusControl({
  courseId,
  status,
}: {
  courseId: string;
  status: "draft" | "published";
}) {
  const { isPending, errorMessage, run } = useApiAction();
  const isPublished = status === "published";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="rounded-full border border-foreground/20 px-3 py-1 text-sm font-medium">
        {isPublished ? "公開中" : "下書き"}
      </span>
      <button
        type="button"
        className={secondaryButtonClass}
        disabled={isPending}
        onClick={() => {
          void run(async () => {
            await apiFetch(
              `/api/admin/courses/${courseId}/${isPublished ? "unpublish" : "publish"}`,
              "POST",
            );
          });
        }}
      >
        {isPublished ? "下書きに戻す" : "公開する"}
      </button>
      {errorMessage && (
        <p role="alert" className={errorTextClass}>
          {errorMessage}
        </p>
      )}
    </div>
  );
}
