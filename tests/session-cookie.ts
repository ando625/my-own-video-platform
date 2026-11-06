import { makeSignature } from "better-auth/crypto";

export const SESSION_COOKIE_NAME = "better-auth.session_token";

/** Better Auth の形式で、ログイン状態のトークンを署名した Cookie の値を作る。 */
export async function createSessionCookieValue(token: string, secret: string) {
  const signature = await makeSignature(token, secret);
  return encodeURIComponent(`${token}.${signature}`);
}
