import { expect, test } from "@playwright/test";
import { signInAs } from "./sign-in";

test("E2E-050: 未ログインで最初のページを開くとウェルカムページが表示される", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login$/);
  const main = page.getByRole("main");
  await expect(
    main.getByRole("heading", {
      name: "動画講座プラットフォームへようこそ",
      level: 1,
    }),
  ).toBeVisible();
  await expect(
    main.getByRole("button", { name: "Googleでログイン" }),
  ).toBeVisible();
});

test("E2E-052: 未ログインのウェルカムページには上部の帯とログインリンクがない", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(
    page.getByRole("main").getByRole("button", { name: "Googleでログイン" }),
  ).toBeVisible();

  await expect(page.locator("header")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "ログイン" })).toHaveCount(0);
});

test("E2E-053: ログアウトすると /login へ移動し、ログインが必要な画面に入れない", async ({
  page,
  context,
}) => {
  await signInAs(context, "logout");
  await page.goto("/");

  await page.getByRole("button", { name: "ログアウト" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator("header")).toHaveCount(0);
  for (const path of ["/", "/admin"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  }
});

test("E2E-051: ログイン済みで /login を開くと / へ移動する", async ({
  page,
  context,
}) => {
  await signInAs(context, "member");

  await page.goto("/login");

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("main").getByRole("heading", { name: "講座一覧" }),
  ).toBeVisible();
});
