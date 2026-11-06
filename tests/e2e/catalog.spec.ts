import { expect, test } from "@playwright/test";
import { signInAs } from "./sign-in";
import { E2E_COURSES, E2E_VIDEO_ID } from "./test-env";

const { first, draft } = E2E_COURSES;

test("E2E-010: 未ログインで / を開くと /login へ移動し、講座は見えない", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText(first.title)).toHaveCount(0);
});

test("E2E-011: 未ログインで視聴ページを開くと /login へ移動し、動画は表示されない", async ({
  page,
}) => {
  await page.goto(`/courses/${first.id}`);

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator("iframe")).toHaveCount(0);
  expect(await page.content()).not.toContain(E2E_VIDEO_ID);
});

test("E2E-012: ログイン済みで一覧から開くと、タイトル、説明、YouTube動画が表示される", async ({
  page,
  context,
}) => {
  await signInAs(context, "member");

  await page.goto("/");
  const list = page.getByRole("main");
  await expect(list.getByRole("link", { name: first.title })).toBeVisible();
  await expect(list.getByText(draft.title)).toHaveCount(0);

  await list.getByRole("link", { name: first.title }).click();
  await expect(page).toHaveURL(new RegExp(`/courses/${first.id}$`));
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: first.title })).toBeVisible();
  await expect(main.getByText(first.description)).toBeVisible();
  await expect(main.locator("iframe")).toHaveAttribute(
    "src",
    new RegExp(`youtube\\.com/embed/${E2E_VIDEO_ID}`),
  );
});

test("E2E-013: 下書きや存在しない講座は404になり、内容は見えない", async ({
  page,
  context,
}) => {
  await signInAs(context, "member");

  for (const path of [`/courses/${draft.id}`, "/courses/missing"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(page.getByText(draft.title)).toHaveCount(0);
    await expect(page.locator("iframe")).toHaveCount(0);
  }
});

test("E2E-043: 一般ユーザーの一覧でカードの画像を押すと動画の画面へ移動する", async ({
  page,
  context,
}) => {
  await signInAs(context, "member");
  await page.goto("/");
  const card = page
    .getByRole("main")
    .getByRole("listitem", { name: first.title });
  await expect(card.locator("img")).toHaveAttribute(
    "src",
    new RegExp(`i\\.ytimg\\.com/vi/${E2E_VIDEO_ID}`),
  );

  await card.locator("img").click();

  await expect(page).toHaveURL(new RegExp(`/courses/${first.id}$`));
  await expect(page.getByRole("main").locator("iframe")).toBeVisible();
});

test("E2E-030: 管理画面で作成して公開すると、受講者の一覧に表示され視聴できる", async ({
  page,
  context,
  browser,
  baseURL,
}) => {
  const title = "E2E-030 公開する講座";
  await signInAs(context, "admin");
  await page.goto("/admin/courses/new");
  const main = page.getByRole("main");
  await main.getByLabel("タイトル").fill(title);
  await main.getByLabel("説明").fill("E2E-030の説明");
  await main.getByLabel("YouTubeのURL").fill(`https://youtu.be/${E2E_VIDEO_ID}`);
  await main.getByRole("button", { name: "保存" }).click();
  await expect(page).toHaveURL(/\/admin\/courses\/[\w-]{36}$/);
  await page.getByRole("main").getByRole("radio", { name: "公開中" }).click();
  await expect(
    page.getByRole("main").getByRole("radio", { name: "公開中" }),
  ).toBeChecked();

  const learner = await browser.newContext({ baseURL });
  await signInAs(learner, "member");
  const learnerPage = await learner.newPage();
  await learnerPage.goto("/");
  await learnerPage.getByRole("main").getByRole("link", { name: title }).click();
  await expect(
    learnerPage.getByRole("main").getByRole("heading", { name: title }),
  ).toBeVisible();
  await expect(learnerPage.getByRole("main").locator("iframe")).toBeVisible();
  await learner.close();

  // 進捗の件数のテストに影響しないように、作成した講座を削除する。
  await page.getByRole("button", { name: "削除", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "削除する" }).click();
  await expect(page).toHaveURL(/\/admin$/);
});
