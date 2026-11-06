import { expect, test } from "@playwright/test";
import { signInAs } from "./sign-in";

const adminHeading = { name: "管理画面", level: 1 } as const;

test("E2E-001: 未ログインで /admin を開くと /login へ移動する", async ({ page }) => {
  await page.goto("/admin");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();
  await expect(page.getByRole("heading", adminHeading)).toHaveCount(0);
});

test("E2E-002: 管理者以外で /admin を開くと404になり管理画面は見えない", async ({
  page,
  context,
}) => {
  await signInAs(context, "member");

  await page.goto("/admin");

  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  await expect(page.getByRole("heading", adminHeading)).toHaveCount(0);
  await expect(page).toHaveURL(/\/admin$/);
});

test("E2E-003: 管理者で /admin を開くと管理画面が表示される", async ({
  page,
  context,
}) => {
  await signInAs(context, "admin");

  await page.goto("/admin");

  await expect(page.getByRole("heading", adminHeading)).toBeVisible();
});

test("E2E-004: 管理者以外でトップページを開くと管理画面のリンクが出ない", async ({
  page,
  context,
}) => {
  await signInAs(context, "member");

  await page.goto("/");

  const header = page.locator("header");
  await expect(header.getByRole("button", { name: "ログアウト" })).toBeVisible();
  await expect(header.getByRole("link", { name: "管理画面" })).toHaveCount(0);
});
