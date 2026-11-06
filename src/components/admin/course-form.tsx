"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApiAction } from "@/hooks/use-api-action";
import { apiFetch } from "@/lib/api-client";
import { errorTextClass, inputClass, primaryButtonClass } from "./ui";

type CourseFormProps = {
  /** 指定すると修正、省略すると新規作成になる。 */
  course?: {
    id: string;
    title: string;
    description: string | null;
    youtubeVideoId: string;
  };
};

export function CourseForm({ course }: CourseFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(course?.title ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(
    course ? `https://youtu.be/${course.youtubeVideoId}` : "",
  );
  const [saved, setSaved] = useState(false);
  const { isPending, errorMessage, run } = useApiAction();

  async function submit() {
    setSaved(false);
    const fields = { title, description, youtubeUrl };

    if (course) {
      const succeeded = await run(async () => {
        await apiFetch(`/api/admin/courses/${course.id}`, "PATCH", fields);
      });
      setSaved(succeeded);
      return;
    }

    await run(
      async () => {
        const { course: created } = (await apiFetch(
          "/api/admin/courses",
          "POST",
          fields,
        )) as { course: { id: string } };
        router.push(`/admin/courses/${created.id}`);
      },
      { keepPendingOnSuccess: true },
    );
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <label className="flex flex-col gap-1 text-sm font-medium">
        タイトル
        <input
          className={inputClass}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        説明
        <textarea
          className={inputClass}
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        YouTubeのURL
        <input
          className={inputClass}
          placeholder="https://www.youtube.com/watch?v=..."
          value={youtubeUrl}
          onChange={(event) => setYoutubeUrl(event.target.value)}
        />
      </label>
      {errorMessage && (
        <p role="alert" className={errorTextClass}>
          {errorMessage}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button type="submit" className={primaryButtonClass} disabled={isPending}>
          保存
        </button>
        {saved && (
          <p role="status" className="text-sm">
            保存しました
          </p>
        )}
      </div>
    </form>
  );
}
