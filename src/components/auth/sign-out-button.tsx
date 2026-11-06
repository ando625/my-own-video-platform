"use client";

import { useAuthActions } from "@/hooks/use-auth-actions";

export function SignOutButton() {
  const { isPending, errorMessage, signOut } = useAuthActions();

  return (
    <>
      {errorMessage && (
        <span role="alert" className="text-red-600 dark:text-red-400">
          {errorMessage}
        </span>
      )}
      <button
        type="button"
        onClick={signOut}
        disabled={isPending}
        className="underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
      >
        ログアウト
      </button>
    </>
  );
}
