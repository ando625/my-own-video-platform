import "server-only";
import { NotFoundError, ValidationError } from "./errors";
import { type CurrentUser, getUserFromHeaders } from "./session";

type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

function errorResponse(status: number, code: ApiErrorCode, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

function handleError(error: unknown): Response {
  if (error instanceof ValidationError) {
    return errorResponse(400, "VALIDATION_ERROR", error.message);
  }
  if (error instanceof NotFoundError) {
    return errorResponse(404, "NOT_FOUND", error.message);
  }
  console.error(error);
  return errorResponse(
    500,
    "INTERNAL_ERROR",
    "サーバーでエラーが発生しました。",
  );
}

/** ログイン中のユーザーだけが実行できる Route Handler を作る。 */
export function withLogin<TArgs extends unknown[]>(
  handler: (
    user: CurrentUser,
    request: Request,
    ...args: TArgs
  ) => Promise<Response>,
) {
  return async (request: Request, ...args: TArgs): Promise<Response> => {
    try {
      const user = await getUserFromHeaders(request.headers);
      if (!user) {
        return errorResponse(401, "UNAUTHORIZED", "ログインしてください。");
      }
      return await handler(user, request, ...args);
    } catch (error) {
      return handleError(error);
    }
  };
}

/** 管理者だけが実行できる Route Handler を作る。 */
export function withAdmin<TArgs extends unknown[]>(
  handler: (request: Request, ...args: TArgs) => Promise<Response>,
) {
  return withLogin<TArgs>(async (user, request, ...args) => {
    if (!user.isAdmin) {
      return errorResponse(403, "FORBIDDEN", "この操作の権限がありません。");
    }
    return handler(request, ...args);
  });
}

/** リクエストの本文をJSONとして読み取る。不正な内容なら入力エラーにする。 */
export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("リクエストの内容が正しくありません。");
  }
}
