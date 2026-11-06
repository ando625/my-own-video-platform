import { expect, type Page, test } from "@playwright/test";
import { signInAs } from "./sign-in";
import { E2E_COURSES } from "./test-env";

const VIDEO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

test.beforeEach(async ({ context }) => {
  await signInAs(context, "admin");
});

async function createCourse(page: Page, title: string) {
  await page.goto("/admin/courses/new");
  const main = page.getByRole("main");
  await main.getByLabel("タイトル").fill(title);
  await main.getByLabel("説明").fill(`${title}の説明`);
  await main.getByLabel("YouTubeのURL").fill(VIDEO_URL);
  await main.getByRole("button", { name: "保存" }).click();
  await expect(page).toHaveURL(/\/admin\/courses\/[\w-]{36}$/);
  await expect(page.getByRole("main").getByLabel("タイトル")).toHaveValue(title);
}

function statusRadio(page: Page, name: "公開中" | "下書き") {
  return page.getByRole("main").getByRole("radio", { name });
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

  await page.goto("/admin/courses/new");
  const main = page.getByRole("main");
  await main.getByLabel("タイトル").fill("E2E-032 講座");
  await main.getByLabel("YouTubeのURL").fill(VIDEO_URL);
  const submit = main.getByRole("button", { name: "保存" });
  await submit.dblclick();
  await expect(submit).toBeDisabled();

  await expect(page).toHaveURL(/\/admin\/courses\/[\w-]{36}$/);
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
  await expect(statusRadio(page, "下書き")).toBeChecked();

  await statusRadio(page, "公開中").click();
  await expect(statusRadio(page, "公開中")).toBeChecked();
  await page.reload();
  await expect(statusRadio(page, "公開中")).toBeChecked();

  await statusRadio(page, "下書き").click();
  await expect(statusRadio(page, "下書き")).toBeChecked();

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
  await page.goto("/admin/courses/new");
  const main = page.getByRole("main");
  await main.getByLabel("タイトル").fill("E2E-036 講座");
  await main.getByLabel("YouTubeのURL").fill("https://example.com/video");
  await main.getByRole("button", { name: "保存" }).click();

  await expect(main.getByRole("alert")).toContainText("YouTube");
  await expect(page).toHaveURL(/\/admin\/courses\/new$/);
  await page.goto("/admin");
  await expect(
    page.getByRole("main").getByRole("link", { name: "E2E-036 講座" }),
  ).toHaveCount(0);
});

test("E2E-040: サイドバーで講座一覧と新規作成を切り替えられ、選択中が分かる", async ({
  page,
}) => {
  await page.goto("/admin");
  const nav = page.getByRole("navigation", { name: "管理メニュー" });
  const listTab = nav.getByRole("link", { name: "講座一覧" });
  const newTab = nav.getByRole("link", { name: "新規作成" });
  await expect(listTab).toHaveAttribute("aria-current", "page");
  await expect(newTab).not.toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("main").getByLabel("タイトル")).toHaveCount(0);

  await newTab.click();

  await expect(page).toHaveURL(/\/admin\/courses\/new$/);
  await expect(newTab).toHaveAttribute("aria-current", "page");
  await expect(listTab).not.toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("main").getByLabel("タイトル")).toBeVisible();

  await listTab.click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(listTab).toHaveAttribute("aria-current", "page");
});

test("E2E-041: 管理者の一覧に画像、タイトル、状態のカードが並び、押すと編集画面へ移動する", async ({
  page,
}) => {
  await page.goto("/admin");
  const card = page
    .getByRole("main")
    .getByRole("listitem", { name: E2E_COURSES.draft.title });

  await expect(card.locator("img")).toHaveAttribute(
    "src",
    /i\.ytimg\.com\/vi\/dQw4w9WgXcQ/,
  );
  await expect(card.getByText("下書き", { exact: true })).toBeVisible();

  await card.locator("img").click();

  await expect(page).toHaveURL(
    new RegExp(`/admin/courses/${E2E_COURSES.draft.id}$`),
  );
});

test("E2E-042: 編集画面で公開中、下書きを選ぶと選択中が分かり、再読み込みしても残る", async ({
  page,
}) => {
  await createCourse(page, "E2E-042 講座");
  await expect(statusRadio(page, "下書き")).toBeChecked();
  await expect(statusRadio(page, "公開中")).not.toBeChecked();

  await statusRadio(page, "公開中").click();

  await expect(statusRadio(page, "公開中")).toBeChecked();
  await expect(statusRadio(page, "下書き")).not.toBeChecked();
  await page.reload();
  await expect(statusRadio(page, "公開中")).toBeChecked();

  // 進捗の件数のテストに影響しないように、下書きへ戻す。
  await statusRadio(page, "下書き").click();
  await expect(statusRadio(page, "下書き")).toBeChecked();
});

test("E2E-044: サムネイルのファイル名をプレビューして保存でき、不正な名前はエラーになる", async ({
  page,
}) => {
  await createCourse(page, "E2E-044 講座");
  const main = page.getByRole("main");
  const thumbnail = main.getByLabel("サムネイルのファイル名");

  await thumbnail.fill("course-1.png");
  await expect(
    main.getByRole("img", { name: "サムネイルのプレビュー" }),
  ).toHaveAttribute("src", "/thumbnails/course-1.png");
  await main.getByRole("button", { name: "保存" }).click();
  await expect(main.getByRole("status")).toContainText("保存しました");

  await page.goto("/admin");
  await expect(
    page
      .getByRole("main")
      .getByRole("listitem", { name: "E2E-044 講座" })
      .locator("img"),
  ).toHaveAttribute("src", "/thumbnails/course-1.png");

  await page.goBack();
  const editMain = page.getByRole("main");
  await editMain.getByLabel("サムネイルのファイル名").fill("../secret.png");
  await editMain.getByRole("button", { name: "保存" }).click();
  await expect(editMain.getByRole("alert")).toContainText("ファイル名");
});
