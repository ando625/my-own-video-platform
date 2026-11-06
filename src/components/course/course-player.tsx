"use client";

import { useRef, useState } from "react";
import { useApiAction } from "@/hooks/use-api-action";
import { useYoutubeEnded } from "@/hooks/use-youtube-ended";
import { apiFetch } from "@/lib/api-client";

type CoursePlayerProps = {
  courseId: string;
  title: string;
  youtubeVideoId: string;
  initialCompleted: boolean;
};

export function CoursePlayer({
  courseId,
  title,
  youtubeVideoId,
  initialCompleted,
}: CoursePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [completed, setCompleted] = useState(initialCompleted);
  const { isPending, errorMessage, run } = useApiAction();

  function changeCompleted(next: boolean) {
    void run(async () => {
      await apiFetch(
        `/api/courses/${courseId}/progress`,
        next ? "PUT" : "DELETE",
      );
      setCompleted(next);
    });
  }

  useYoutubeEnded(iframeRef, () => changeCompleted(true));

  return (
    <div className="flex flex-col gap-4">
      <iframe
        ref={iframeRef}
        src={`https://www.youtube.com/embed/${youtubeVideoId}?enablejsapi=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="aspect-video w-full rounded-md"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-pressed={completed}
          disabled={isPending}
          onClick={() => changeCompleted(!completed)}
          className={`rounded-md border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
            completed
              ? "border-foreground bg-foreground text-background"
              : "border-foreground/20 hover:bg-foreground/5"
          }`}
        >
          完了
        </button>
        <span className="text-sm text-foreground/70">
          {completed ? "視聴済み" : "未視聴"}
        </span>
        {errorMessage && (
          <p role="alert" className="text-sm text-red-700 dark:text-red-400">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
