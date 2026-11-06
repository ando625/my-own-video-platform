/**
 * テストが本番のTursoなどへ接続しないように確認する。
 * `.test` フォルダ内のローカルファイル以外なら、エラーで止める。
 */
export function assertTestDatabase(url: string | undefined): void {
  if (!url || !/^file:\.test\/[\w-]+\.db$/.test(url)) {
    throw new Error(
      "テストの接続先が不正です。`.test` フォルダ内のローカルDBを指定してください。",
    );
  }
}
