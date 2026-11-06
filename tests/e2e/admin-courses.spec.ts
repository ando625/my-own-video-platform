import { expect, type Page, test } from "@playwright/test";
import { signInAs } from "./sign-in";

const VIDEO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

test.beforeEach(async ({ context }) => {
  await signInAs(context, "admin");
});

async function createCourse(page: Page, title: string) {
  await page.goto("/admin");
  const main = page.getByRole("main");
  await main.getByLabel("タイトル").fill(title);
  await main.getByLabel("説明").fill(`${title}の説明`);
  await main.getByLabel("YouTubeのURL").fill(VIDEO_URL);
  await main.getByRole("button", { name: "保存" }).click();
  await expect(page).toHaveURL(/\/admin\/courses\/[\w-]+$/);
  await expect(page.getByRole("main").getByLabel("タイトル")).toHaveValue(title);
}

test("E2E-031: 削除の確認ダイアログをキャンセルすると削除されない", async ({
  page,
}) => {
  await createCourse(page, "E2E-031 講座");

  await page.getByRole("button", { name: "削除", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "キャンセル" }).click();

  await expect(dialog).toBeHidden();
  await page.reload();
  await expect(page.getByRole("main").getByLabel("タイトル")).toHaveValue(
    "E2E-031 講座",
  );
});

test("E2E-032: 通信中に保存ボタンを連打しても1件だけ作成される", async ({
  page,
}) => {
  let postCount = 0;
  await page.route("**/api/admin/courses", async (route) => {
    if (route.request().method() === "POST") {
      postCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    await route.continue();
  });

  await page.goto("/admin");
  const main = page.getByRole("main");
  await main.getByLabel("タイトル").fill("E2E-032 講座");
  await main.getByLabel("YouTubeのURL").fill(VIDEO_URL);
  const submit = main.getByRole("button", { name: "保存" });
  await submit.dblclick();
  await expect(submit).toBeDisabled();

  await expect(page).toHaveURL(/\/admin\/courses\/[\w-]+$/);
  expect(postCount).toBe(1);

  await page.goto("/admin");
  await expect(
    page.getByRole("main").getByRole("link", { name: "E2E-032 講座" }),
  ).toHaveCount(1);
});

test("E2E-033: 作成して公開、下書きへ戻す、修正すると、再読み込みしても残る", async ({
  page,
}) => {
  await createCourse(page, "E2E-033 講座");
  const main = page.getByRole("main");
  await expect(main.getByText("下書き", { exact: true })).toBeVisible();

  await main.getByRole("button", { name: "公開する" }).click();
  await expect(main.getByText("公開中", { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("main").getByText("公開中", { exact: true }),
  ).toBeVisible();

  await page.getByRole("main").getByRole("button", { name: "下書きに戻す" }).click();
  await expect(
    page.getByRole("main").getByText("下書き", { exact: true }),
  ).toBeVisible();

  await page.getByRole("main").getByLabel("タイトル").fill("E2E-033 修正後");
  await page.getByRole("main").getByRole("button", { name: "保存" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText(
    "保存しました",
  );
  await page.reload();
  await expect(page.getByRole("main").getByLabel("タイトル")).toHaveValue(
    "E2E-033 修正後",
  );
});

test("E2E-034: 確認ダイアログで削除を確定すると削除され、一覧から消える", async ({
  page,
}) => {
  await createCourse(page, "E2E-034 講座");

  await page.getByRole("button", { name: "削除", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "削除する" }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.getByRole("main").getByRole("link", { name: "E2E-034 講座" }),
  ).toHaveCount(0);
});

test("E2E-036: 不正なYouTube URLを保存するとエラーが表示され、保存されない", async ({
  page,
}) => {
  await page.goto("/admin");
  const main = page.getByRole("main");
  await main.getByLabel("タイトル").fill("E2E-036 講座");
  await main.getByLabel("YouTubeのURL").fill("https://example.com/video");
  await main.getByRole("button", { name: "保存" }).click();

  await expect(main.getByRole("alert")).toContainText("YouTube");
  await expect(page).toHaveURL(/\/admin$/);
  await page.reload();
  await expect(
    page.getByRole("main").getByRole("link", { name: "E2E-036 講座" }),
  ).toHaveCount(0);
});
