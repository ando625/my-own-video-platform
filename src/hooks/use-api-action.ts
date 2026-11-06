"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const GENERIC_ERROR = "通信に失敗しました。もう一度お試しください。";

type RunOptions = {
  /** 成功後に別のページへ移動する操作では、押せない状態のまま移動を待つ。 */
  keepPendingOnSuccess?: boolean;
};

/** APIを呼ぶ操作の、通信中の状態とエラー表示、成功後の再読み込みをまとめる。 */
export function useApiAction() {
  const router = useRouter();
  const inFlight = useRef(false);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function run(
    action: () => Promise<void>,
    options: RunOptions = {},
  ): Promise<boolean> {
    if (inFlight.current) {
      return false;
    }
    inFlight.current = true;
    setIsPending(true);
    setErrorMessage(null);

    try {
      await action();
      if (options.keepPendingOnSuccess) {
        return true;
      }
      router.refresh();
      inFlight.current = false;
      setIsPending(false);
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : GENERIC_ERROR);
      inFlight.current = false;
      setIsPending(false);
      return false;
    }
  }

  return { isPending, errorMessage, run };
}
