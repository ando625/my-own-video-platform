import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { courses } from "@/db/schema";
import {
  getCourseForViewing,
  listPublishedCourses,
} from "@/services/catalog-service";
import { resetTestDatabase } from "./test-database";

const VIDEO_ID = "dQw4w9WgXcQ";

describe("受講者向けのデータ", () => {
  beforeEach(async () => {
    await resetTestDatabase();
    await db.insert(courses).values([
      {
        id: "published",
        title: "公開中の講座",
        description: "公開中の説明",
        youtubeVideoId: VIDEO_ID,
        status: "published",
      },
      {
        id: "draft",
        title: "下書きの講座",
        youtubeVideoId: VIDEO_ID,
        status: "draft",
      },
    ]);
  });

  it("IT-050: 受講者向けの一覧には published の講座だけが返る", async () => {
    const result = await listPublishedCourses();

    expect(result.map((course) => course.id)).toEqual(["published"]);
  });

  it("IT-051: 下書き、存在しない講座は視聴用に取得できない", async () => {
    await expect(getCourseForViewing("draft")).resolves.toBeNull();
    await expect(getCourseForViewing("missing")).resolves.toBeNull();
  });

  it("IT-053: 公開中の講座は、タイトル、説明、動画IDを視聴用に取得できる", async () => {
    const course = await getCourseForViewing("published");

    expect(course?.title).toBe("公開中の講座");
    expect(course?.description).toBe("公開中の説明");
    expect(course?.youtubeVideoId).toBe(VIDEO_ID);
  });
});
