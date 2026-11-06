"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function useAuthActions() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function signInWithGoogle() {
    setIsPending(true);
    setErrorMessage(null);
    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
      if (error) {
        setErrorMessage("ログインを開始できませんでした。もう一度お試しください。");
        setIsPending(false);
      }
      // 成功時は Google の画面へ移動するので、押せない状態のままにする。
    } catch {
      setErrorMessage("通信に失敗しました。もう一度お試しください。");
      setIsPending(false);
    }
  }

  async function signOut() {
    setIsPending(true);
    setErrorMessage(null);
    try {
      const { error } = await authClient.signOut();
      if (error) {
        setErrorMessage("ログアウトできませんでした。もう一度お試しください。");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setErrorMessage("通信に失敗しました。もう一度お試しください。");
    } finally {
      setIsPending(false);
    }
  }

  return { isPending, errorMessage, signInWithGoogle, signOut };
}
