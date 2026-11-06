"use client";

import { useApiAction } from "@/hooks/use-api-action";
import { apiFetch } from "@/lib/api-client";
import { errorTextClass } from "./ui";

type CourseStatus = "draft" | "published";

const options: { value: CourseStatus; label: string; action: string }[] = [
  { value: "published", label: "公開中", action: "publish" },
  { value: "draft", label: "下書き", action: "unpublish" },
];

export function CourseStatusControl({
  courseId,
  status,
}: {
  courseId: string;
  status: CourseStatus;
}) {
  const { isPending, errorMessage, run } = useApiAction();

  return (
    <fieldset className="flex flex-col gap-2" disabled={isPending}>
      <legend className="mb-2 text-sm font-medium">公開状態</legend>
      <div className="inline-flex w-fit rounded-lg border border-foreground/20 p-1">
        {options.map((option) => {
          const selected = status === option.value;
          return (
            <label
              key={option.value}
              className={`relative rounded-md px-5 py-2 text-sm font-medium ${
                selected
                  ? "bg-foreground text-background"
                  : "text-foreground/70 hover:bg-foreground/5"
              } ${isPending ? "opacity-50" : ""}`}
            >
              <input
                type="radio"
                name="course-status"
                value={option.value}
                checked={selected}
                className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                onChange={() => {
                  void run(async () => {
                    await apiFetch(
                      `/api/admin/courses/${courseId}/${option.action}`,
                      "POST",
                    );
                  });
                }}
              />
              {option.label}
            </label>
          );
        })}
      </div>
      {errorMessage && (
        <p role="alert" className={errorTextClass}>
          {errorMessage}
        </p>
      )}
    </fieldset>
  );
}
