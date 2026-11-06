import type { BrowserContext } from "@playwright/test";
import { createSessionCookieValue, SESSION_COOKIE_NAME } from "../session-cookie";
import { E2E_AUTH_SECRET, E2E_BASE_URL, E2E_USERS } from "./test-env";

/** テスト用DBに作ったログイン状態を、署名付き Cookie としてブラウザに渡す。 */
export async function signInAs(
  context: BrowserContext,
  role: keyof typeof E2E_USERS,
) {
  await context.addCookies([
    {
      name: SESSION_COOKIE_NAME,
      value: await createSessionCookieValue(
        E2E_USERS[role].sessionToken,
        E2E_AUTH_SECRET,
      ),
      url: E2E_BASE_URL,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}
