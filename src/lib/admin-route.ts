import "server-only";
import { ConflictError, NotFoundError, ValidationError } from "./errors";
import { getUserFromHeaders } from "./session";

type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

function errorResponse(status: number, code: ApiErrorCode, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

/** 管理者だけが処理を実行できる Route Handler を作り、エラーの形式を統一する。 */
export function withAdmin<TArgs extends unknown[]>(
  handler: (request: Request, ...args: TArgs) => Promise<Response>,
) {
  return async (request: Request, ...args: TArgs): Promise<Response> => {
    try {
      const user = await getUserFromHeaders(request.headers);
      if (!user) {
        return errorResponse(401, "UNAUTHORIZED", "ログインしてください。");
      }
      if (!user.isAdmin) {
        return errorResponse(403, "FORBIDDEN", "この操作の権限がありません。");
      }
      return await handler(request, ...args);
    } catch (error) {
      if (error instanceof ValidationError) {
        return errorResponse(400, "VALIDATION_ERROR", error.message);
      }
      if (error instanceof NotFoundError) {
        return errorResponse(404, "NOT_FOUND", error.message);
      }
      if (error instanceof ConflictError) {
        return errorResponse(409, "CONFLICT", error.message);
      }
      console.error(error);
      return errorResponse(
        500,
        "INTERNAL_ERROR",
        "サーバーでエラーが発生しました。",
      );
    }
  };
}

/** リクエストの本文をJSONとして読み取る。不正な内容なら入力エラーにする。 */
export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("リクエストの内容が正しくありません。");
  }
}
