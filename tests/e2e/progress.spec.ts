import { expect, type Page, test } from "@playwright/test";
import { signInAs } from "./sign-in";
import { E2E_COURSES } from "./test-env";

const { first, second } = E2E_COURSES;

/** 本物のYouTubeの代わりに読み込み、再生イベントをテストから起こせるようにする。 */
const YOUTUBE_API_STUB = `
  window.YT = {
    PlayerState: { ENDED: 0, PLAYING: 1 },
    Player: function (element, options) {
      window.__youtubeEvents = options.events;
      return { destroy() {} };
    },
  };
  window.onYouTubeIframeAPIReady?.();
`;

type StateEvents = {
  __youtubeEvents: { onStateChange: (event: { data: number }) => void };
};

test.beforeEach(async ({ page, context }) => {
  await signInAs(context, "member");
  await page.route("https://www.youtube.com/iframe_api", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: YOUTUBE_API_STUB,
    }),
  );
  await page.route("https://www.youtube.com/embed/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<html></html>" }),
  );

  for (const course of [first, second]) {
    const response = await context.request.delete(
      `/api/courses/${course.id}/progress`,
    );
    expect(response.ok()).toBe(true);
  }
});

function completeButton(page: Page) {
  return page.getByRole("main").getByRole("button", { name: "完了" });
}

function progressText(page: Page, completed: number) {
  return page.getByRole("main").getByText(`2本中${completed}本 視聴済み`);
}

test("E2E-020: 完了ボタンを押すと視聴済みになり、一覧の進捗が増える", async ({
  page,
}) => {
  await page.goto("/");
  await expect(progressText(page, 0)).toBeVisible();

  await page.goto(`/courses/${first.id}`);
  await expect(completeButton(page)).toHaveAttribute("aria-pressed", "false");
  await completeButton(page).click();
  await expect(completeButton(page)).toHaveAttribute("aria-pressed", "true");

  await page.goto("/");
  await expect(progressText(page, 1)).toBeVisible();
  await expect(
    page
      .getByRole("main")
      .getByRole("listitem", { name: `${first.title}（視聴済み）` }),
  ).toBeVisible();
});

test("E2E-021: 完了ボタンを押し直すと未視聴に戻り、一覧の進捗が減る", async ({
  page,
}) => {
  await page.goto(`/courses/${first.id}`);
  await completeButton(page).click();
  await expect(completeButton(page)).toHaveAttribute("aria-pressed", "true");

  await completeButton(page).click();
  await expect(completeButton(page)).toHaveAttribute("aria-pressed", "false");

  await page.reload();
  await expect(completeButton(page)).toHaveAttribute("aria-pressed", "false");
  await page.goto("/");
  await expect(progressText(page, 0)).toBeVisible();
});

test("E2E-022: 動画の再生終了イベントが起きると自動で視聴済みになる", async ({
  page,
}) => {
  await page.goto(`/courses/${second.id}`);
  await expect(completeButton(page)).toHaveAttribute("aria-pressed", "false");
  await page.waitForFunction(() => "__youtubeEvents" in window);

  await page.evaluate(() => {
    (window as unknown as StateEvents).__youtubeEvents.onStateChange({ data: 1 });
  });
  await expect(completeButton(page)).toHaveAttribute("aria-pressed", "false");

  await page.evaluate(() => {
    (window as unknown as StateEvents).__youtubeEvents.onStateChange({ data: 0 });
  });
  await expect(completeButton(page)).toHaveAttribute("aria-pressed", "true");

  await page.goto("/");
  await expect(progressText(page, 1)).toBeVisible();
});
