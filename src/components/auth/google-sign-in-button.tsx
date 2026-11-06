"use client";

import { useAuthActions } from "@/hooks/use-auth-actions";

export function GoogleSignInButton() {
  const { isPending, errorMessage, signInWithGoogle } = useAuthActions();

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={isPending}
        className="rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Googleでログイン
      </button>
      {errorMessage && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
