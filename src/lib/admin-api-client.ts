const GENERIC_ERROR = "処理に失敗しました。もう一度お試しください。";

type ApiErrorBody = { error?: { message?: string } };

/** ブラウザから管理用APIを呼ぶ。失敗時は表示できるメッセージのエラーを投げる。 */
export async function adminFetch(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<unknown> {
  const response = await fetch(`/api/admin${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message = (data as ApiErrorBody | null)?.error?.message;
    throw new Error(message ?? GENERIC_ERROR);
  }
  return data;
}
