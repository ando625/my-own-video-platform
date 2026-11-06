"use client";

import { useRef } from "react";
import { useAdminAction } from "@/hooks/use-admin-action";
import {
  dangerButtonClass,
  errorTextClass,
  secondaryButtonClass,
} from "./ui";

type DeleteButtonProps = {
  label: string;
  confirmMessage: string;
  onDelete: () => Promise<void>;
  /** 削除後に別のページへ移動する場合は true。 */
  navigatesAway?: boolean;
};

/** 確認ダイアログを挟んで削除する。元に戻せない操作なので、必ず確認する。 */
export function DeleteButton({
  label,
  confirmMessage,
  onDelete,
  navigatesAway = false,
}: DeleteButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { isPending, errorMessage, run } = useAdminAction();

  async function handleConfirm() {
    const succeeded = await run(onDelete, {
      keepPendingOnSuccess: navigatesAway,
    });
    if (succeeded) {
      dialogRef.current?.close();
    }
  }

  return (
    <>
      <button
        type="button"
        className={dangerButtonClass}
        onClick={() => dialogRef.current?.showModal()}
      >
        {label}
      </button>
      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-md rounded-lg bg-background p-6 text-foreground backdrop:bg-black/50"
      >
        <p className="text-sm">{confirmMessage}</p>
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
            onClick={handleConfirm}
          >
            削除する
          </button>
        </div>
      </dialog>
    </>
  );
}
