import { describe, expect, it } from "vitest";
import { getCourseThumbnailSrc } from "@/lib/course-thumbnail";

describe("getCourseThumbnailSrc", () => {
  it("UT-040: ファイル名がある講座は /thumbnails/ファイル名 を表示先にする", () => {
    expect(
      getCourseThumbnailSrc({
        thumbnailFileName: "course-1.png",
        youtubeVideoId: "dQw4w9WgXcQ",
      }),
    ).toBe("/thumbnails/course-1.png");
  });

  it("UT-041: ファイル名がない講座はYouTubeの動画の画像を表示先にする", () => {
    expect(
      getCourseThumbnailSrc({
        thumbnailFileName: null,
        youtubeVideoId: "dQw4w9WgXcQ",
      }),
    ).toBe("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
  });
});
