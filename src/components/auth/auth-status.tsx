import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { SignOutButton } from "./sign-out-button";

export async function AuthStatus() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link href="/login" className="underline-offset-4 hover:underline">
        ログイン
      </Link>
    );
  }

  return (
    <>
      <span>{user.name}</span>
      {user.isAdmin && (
        <Link href="/admin" className="underline-offset-4 hover:underline">
          管理画面
        </Link>
      )}
      <SignOutButton />
    </>
  );
}
