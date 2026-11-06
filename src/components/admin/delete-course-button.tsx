"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { useApiAction } from "@/hooks/use-api-action";
import { apiFetch } from "@/lib/api-client";
import {
  dangerButtonClass,
  errorTextClass,
  secondaryButtonClass,
} from "./ui";

/** 確認ダイアログを挟んで削除する。元に戻せない操作なので、必ず確認する。 */
export function DeleteCourseButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { isPending, errorMessage, run } = useApiAction();

  return (
    <>
      <button
        type="button"
        className={dangerButtonClass}
        onClick={() => dialogRef.current?.showModal()}
      >
        削除
      </button>
      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-md rounded-lg bg-background p-6 text-foreground backdrop:bg-black/50"
      >
        <p className="text-sm">
          この講座と、受講者の視聴記録を削除します。元に戻せません。
        </p>
        {errorMessage && (
          <p role="alert" className={`mt-3 ${errorTextClass}`}>
            {errorMessage}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className={secondaryButtonClass}
            disabled={isPending}
            onClick={() => dialogRef.current?.close()}
          >
            キャンセル
          </button>
          <button
            type="button"
            className={dangerButtonClass}
            disabled={isPending}
            onClick={() => {
              void run(
                async () => {
                  await apiFetch(`/api/admin/courses/${courseId}`, "DELETE");
                  dialogRef.current?.close();
                  router.push("/admin");
                  router.refresh();
                },
                { keepPendingOnSuccess: true },
              );
            }}
          >
            削除する
          </button>
        </div>
      </dialog>
    </>
  );
}
