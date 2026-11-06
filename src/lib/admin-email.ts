function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * 管理者かどうかを判定する。
 * Google で確認済みのメールアドレスが ADMIN_EMAIL と一致するときだけ true を返す。
 * ADMIN_EMAIL が未設定や空のときは、誰も管理者にしない。
 */
export function isAdminEmail(
  email: string,
  emailVerified: boolean,
  adminEmail: string | undefined,
): boolean {
  if (!emailVerified || !adminEmail) {
    return false;
  }
  const normalizedAdminEmail = normalizeEmail(adminEmail);
  return (
    normalizedAdminEmail !== "" && normalizeEmail(email) === normalizedAdminEmail
  );
}
