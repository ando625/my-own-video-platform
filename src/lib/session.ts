import "server-only";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { isAdminEmail } from "./admin-email";
import { auth } from "./auth";

export type CurrentUser = {
  id: string;
  name: string;
  isAdmin: boolean;
};

/** ページの表示時に、ログイン中のユーザーを返す。未ログインなら null を返す。 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  return getUserFromHeaders(await headers());
}

/** リクエストのヘッダーから、ログイン中のユーザーを返す。未ログインなら null を返す。 */
export async function getUserFromHeaders(
  requestHeaders: Headers,
): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    return null;
  }

  const { id, name, email, emailVerified } = session.user;
  return {
    id,
    name,
    isAdmin: isAdminEmail(email, emailVerified, process.env.ADMIN_EMAIL),
  };
}

/** 管理者のページで使う。未ログインはログイン画面へ送り、管理者以外には存在を隠す。 */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.isAdmin) {
    notFound();
  }
  return user;
}
