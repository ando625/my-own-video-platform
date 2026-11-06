"use client";

import { useAdminAction } from "@/hooks/use-admin-action";
import { adminFetch } from "@/lib/admin-api-client";
import { errorTextClass, secondaryButtonClass } from "./ui";

type MoveButtonsProps = {
  /** 例: /sections/ID/move */
  movePath: string;
  /** ボタンの名前に使う。例: セクション */
  itemName: string;
  isFirst: boolean;
  isLast: boolean;
};

export function MoveButtons({
  movePath,
  itemName,
  isFirst,
  isLast,
}: MoveButtonsProps) {
  const { isPending, errorMessage, run } = useAdminAction();

  function move(direction: "up" | "down") {
    void run(async () => {
      await adminFetch(movePath, "POST", { direction });
    });
  }

  return (
    <>
      <button
        type="button"
        className={secondaryButtonClass}
        disabled={isPending || isFirst}
        onClick={() => move("up")}
      >
        {itemName}を上へ
      </button>
      <button
        type="button"
        className={secondaryButtonClass}
        disabled={isPending || isLast}
        onClick={() => move("down")}
      >
        {itemName}を下へ
      </button>
      {errorMessage && (
        <p role="alert" className={errorTextClass}>
          {errorMessage}
        </p>
      )}
    </>
  );
}
