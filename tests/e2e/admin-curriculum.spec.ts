import { expect, type Page, test } from "@playwright/test";
import { signInAs } from "./sign-in";

const VIDEO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

test.beforeEach(async ({ context }) => {
  await signInAs(context, "admin");
});

async function createCourse(page: Page, title: string) {
  await page.goto("/admin");
  await page.getByLabel("コース名").fill(title);
  await page.getByRole("button", { name: "コースを作成" }).click();
  await expect(page).toHaveURL(/\/admin\/courses\/[\w-]+$/);
  await expect(page.getByLabel("タイトル", { exact: true })).toHaveValue(title);
}

async function addSection(page: Page, title: string) {
  await page.getByLabel("新しいセクション名").fill(title);
  await page.getByRole("button", { name: "セクションを追加" }).click();
  await expect(sectionItem(page, title)).toBeVisible();
}

async function addLesson(page: Page, sectionTitle: string, title: string) {
  const section = sectionItem(page, sectionTitle);
  await section.getByLabel("新しいレッスン名").fill(title);
  await section.getByLabel("YouTubeのURL").fill(VIDEO_URL);
  await section.getByRole("button", { name: "レッスンを追加" }).click();
  await expect(lessonItem(page, title)).toBeVisible();
}

function sectionItem(page: Page, title: string) {
  return page.getByRole("listitem", {
    name: `セクション: ${title}`,
    exact: true,
  });
}

function lessonItem(page: Page, title: string) {
  return page.getByRole("listitem", {
    name: `レッスン: ${title}`,
    exact: true,
  });
}

async function listItemNames(page: Page, prefix: string) {
  return page
    .getByRole("listitem", { name: new RegExp(`^${prefix}: `) })
    .evaluateAll((items) =>
      items.map((item) => item.getAttribute("aria-label")),
    );
}

test("E2E-031: 削除の確認ダイアログをキャンセルすると削除されない", async ({
  page,
}) => {
  await createCourse(page, "E2E-031 コース");
  await addSection(page, "残すセクション");

  await sectionItem(page, "残すセクション")
    .getByRole("button", { name: "セクションを削除" })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "キャンセル" }).click();

  await expect(dialog).toBeHidden();
  await page.reload();
  await expect(sectionItem(page, "残すセクション")).toBeVisible();
});

test("E2E-032: 通信中に作成ボタンを連打しても1件だけ作成される", async ({
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
  await page.getByLabel("コース名").fill("E2E-032 コース");
  const submit = page.getByRole("button", { name: "コースを作成" });
  await submit.dblclick();
  await expect(submit).toBeDisabled();

  await expect(page).toHaveURL(/\/admin\/courses\/[\w-]+$/);
  expect(postCount).toBe(1);

  await page.goto("/admin");
  await expect(page.getByRole("link", { name: "E2E-032 コース" })).toHaveCount(1);
});

test("E2E-033: コース、セクション、レッスンを作成して公開すると再読み込みしても残る", async ({
  page,
}) => {
  await createCourse(page, "E2E-033 コース");
  await expect(page.getByRole("main").getByText("下書き", { exact: true })).toBeVisible();

  await addSection(page, "第1章");
  await addLesson(page, "第1章", "第1節");
  await page.getByRole("button", { name: "公開する" }).click();
  await expect(page.getByRole("main").getByText("公開中", { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("タイトル", { exact: true })).toHaveValue(
    "E2E-033 コース",
  );
  await expect(sectionItem(page, "第1章")).toBeVisible();
  await expect(lessonItem(page, "第1節")).toBeVisible();
  await expect(page.getByRole("main").getByText("公開中", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "下書きに戻す" }).click();
  await expect(page.getByRole("main").getByText("下書き", { exact: true })).toBeVisible();
});

test("E2E-034: 確認ダイアログで削除を確定すると削除される", async ({ page }) => {
  await createCourse(page, "E2E-034 コース");
  await addSection(page, "消すセクション");
  await addLesson(page, "消すセクション", "消すレッスン");

  await lessonItem(page, "消すレッスン")
    .getByRole("button", { name: "レッスンを削除" })
    .click();
  await page.getByRole("dialog").getByRole("button", { name: "削除する" }).click();
  await expect(lessonItem(page, "消すレッスン")).toHaveCount(0);

  await sectionItem(page, "消すセクション")
    .getByRole("button", { name: "セクションを削除" })
    .click();
  await page.getByRole("dialog").getByRole("button", { name: "削除する" }).click();
  await expect(sectionItem(page, "消すセクション")).toHaveCount(0);

  await page.getByRole("button", { name: "コースを削除" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "削除する" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("link", { name: "E2E-034 コース" })).toHaveCount(0);
});

test("E2E-035: 2番目のセクションとレッスンの上へを押すと順番が入れ替わる", async ({
  page,
}) => {
  await createCourse(page, "E2E-035 コース");
  await addSection(page, "A章");
  await addSection(page, "B章");
  await addLesson(page, "A章", "A節");
  await addLesson(page, "A章", "B節");

  await sectionItem(page, "B章")
    .getByRole("button", { name: "セクションを上へ" })
    .click();
  await expect
    .poll(() => listItemNames(page, "セクション"))
    .toEqual(["セクション: B章", "セクション: A章"]);

  await lessonItem(page, "B節")
    .getByRole("button", { name: "レッスンを上へ" })
    .click();
  await expect
    .poll(() => listItemNames(page, "レッスン"))
    .toEqual(["レッスン: B節", "レッスン: A節"]);

  await page.reload();
  await expect
    .poll(() => listItemNames(page, "セクション"))
    .toEqual(["セクション: B章", "セクション: A章"]);
  await expect
    .poll(() => listItemNames(page, "レッスン"))
    .toEqual(["レッスン: B節", "レッスン: A節"]);
});

test("E2E-036: レッスンのないコースの公開と不正なURLの保存はエラーになる", async ({
  page,
}) => {
  await createCourse(page, "E2E-036 コース");

  await page.getByRole("button", { name: "公開する" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("レッスンが1本以上");
  await expect(page.getByRole("main").getByText("下書き", { exact: true })).toBeVisible();

  await addSection(page, "第1章");
  const section = sectionItem(page, "第1章");
  await section.getByLabel("新しいレッスン名").fill("不正なレッスン");
  await section.getByLabel("YouTubeのURL").fill("https://example.com/video");
  await section.getByRole("button", { name: "レッスンを追加" }).click();
  await expect(section.getByRole("alert")).toContainText("YouTube");

  await page.reload();
  await expect(lessonItem(page, "不正なレッスン")).toHaveCount(0);
});

test("E2E-037: サムネイルのプレビューと保存、不正な場所のエラー", async ({
  page,
}) => {
  await createCourse(page, "E2E-037 コース");
  const thumbnail = page.getByLabel("サムネイルの場所");

  await thumbnail.fill("/thumbnails/course-1.png");
  await expect(page.getByRole("img", { name: "サムネイルのプレビュー" })).toHaveAttribute(
    "src",
    "/thumbnails/course-1.png",
  );
  await page.getByRole("button", { name: "コースを保存" }).click();
  await expect(page.getByRole("status")).toContainText("保存しました");

  await page.reload();
  await expect(thumbnail).toHaveValue("/thumbnails/course-1.png");

  await thumbnail.fill("https://example.com/image.png");
  await page.getByRole("button", { name: "コースを保存" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("/thumbnails/");

  await page.reload();
  await expect(thumbnail).toHaveValue("/thumbnails/course-1.png");
});
