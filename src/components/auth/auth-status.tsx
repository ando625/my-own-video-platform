import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { SignOutButton } from "./sign-out-button";

/** ログイン中だけ表示する上部の帯。未ログインなら何も表示しない。 */
export async function AuthStatus() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <header className="flex min-h-12 items-center justify-end gap-4 border-b border-foreground/10 px-6 py-2 text-sm">
      <span>{user.name}</span>
      {user.isAdmin && (
        <Link href="/admin" className="underline-offset-4 hover:underline">
          管理画面
        </Link>
      )}
      <SignOutButton />
    </header>
  );
}
