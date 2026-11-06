import { db } from "@/db";
import { session, user } from "@/db/schema";
import {
  createSessionCookieValue,
  SESSION_COOKIE_NAME,
} from "../session-cookie";

const TEST_USERS = {
  admin: { id: "it-admin", email: "admin@example.com" },
  member: { id: "it-member", email: "member@example.com" },
} as const;

/** テスト用DBにユーザーとログイン状態を作り、リクエストに付ける Cookie を返す。 */
export async function createLoggedInCookie(role: keyof typeof TEST_USERS) {
  const { id, email } = TEST_USERS[role];
  const token = `${id}-session-token`;
  const now = new Date();

  await db.insert(user).values({
    id,
    name: role,
    email,
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(session).values({
    id: `${id}-session`,
    token,
    userId: id,
    expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
    createdAt: now,
    updatedAt: now,
  });

  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET が設定されていません。");
  }
  const value = await createSessionCookieValue(token, secret);
  return `${SESSION_COOKIE_NAME}=${value}`;
}
