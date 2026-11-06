"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminAction } from "@/hooks/use-admin-action";
import { adminFetch } from "@/lib/admin-api-client";
import { errorTextClass, inputClass, primaryButtonClass } from "./ui";

export function CreateCourseForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const { isPending, errorMessage, run } = useAdminAction();

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        void run(
          async () => {
            const { course } = (await adminFetch("/courses", "POST", {
              title,
            })) as { course: { id: string } };
            router.push(`/admin/courses/${course.id}`);
          },
          { keepPendingOnSuccess: true },
        );
      }}
    >
      <label className="flex flex-col gap-1 text-sm font-medium">
        コース名
        <input
          className={inputClass}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      {errorMessage && (
        <p role="alert" className={errorTextClass}>
          {errorMessage}
        </p>
      )}
      <div>
        <button type="submit" className={primaryButtonClass} disabled={isPending}>
          コースを作成
        </button>
      </div>
    </form>
  );
}
