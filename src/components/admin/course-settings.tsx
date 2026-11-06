"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminAction } from "@/hooks/use-admin-action";
import { adminFetch } from "@/lib/admin-api-client";
import { DeleteButton } from "./delete-button";
import {
  errorTextClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "./ui";

type CourseSettingsProps = {
  course: {
    id: string;
    title: string;
    description: string | null;
    thumbnailPath: string | null;
    status: "draft" | "published";
  };
};

export function CourseSettings({ course }: CourseSettingsProps) {
  const router = useRouter();
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description ?? "");
  const [thumbnailPath, setThumbnailPath] = useState(course.thumbnailPath ?? "");
  const [saved, setSaved] = useState(false);
  const { isPending, errorMessage, run } = useAdminAction();
  const isPublished = course.status === "published";

  function changeStatus() {
    setSaved(false);
    void run(async () => {
      await adminFetch(
        `/courses/${course.id}/${isPublished ? "unpublish" : "publish"}`,
        "POST",
      );
    });
  }

  async function save() {
    setSaved(false);
    const succeeded = await run(async () => {
      await adminFetch(`/courses/${course.id}`, "PATCH", {
        title,
        description,
        thumbnailPath,
      });
    });
    setSaved(succeeded);
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-foreground/20 px-3 py-1 text-sm font-medium">
          {isPublished ? "公開中" : "下書き"}
        </span>
        <button
          type="button"
          className={secondaryButtonClass}
          disabled={isPending}
          onClick={changeStatus}
        >
          {isPublished ? "下書きに戻す" : "公開する"}
        </button>
      </div>

      {errorMessage && (
        <p role="alert" className={errorTextClass}>
          {errorMessage}
        </p>
      )}

      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
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
          サムネイルの場所
          <input
            className={inputClass}
            placeholder="/thumbnails/course-1.png"
            value={thumbnailPath}
            onChange={(event) => setThumbnailPath(event.target.value)}
          />
        </label>
        {thumbnailPath.startsWith("/thumbnails/") && (
          // 入力中の場所をそのまま確認するため、next/image の変換は通さない。
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailPath}
            alt="サムネイルのプレビュー"
            className="h-32 w-56 rounded-md border border-foreground/20 object-cover"
          />
        )}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className={primaryButtonClass}
            disabled={isPending}
          >
            コースを保存
          </button>
          {saved && (
            <p role="status" className="text-sm">
              保存しました
            </p>
          )}
        </div>
      </form>

      <div className="mt-2 border-t border-foreground/10 pt-4">
        <DeleteButton
          label="コースを削除"
          confirmMessage="このコースと、配下のセクション、レッスン、受講者の進捗をすべて削除します。元に戻せません。"
          navigatesAway
          onDelete={async () => {
            await adminFetch(`/courses/${course.id}`, "DELETE");
            router.push("/admin");
            router.refresh();
          }}
        />
      </div>
    </section>
  );
}
