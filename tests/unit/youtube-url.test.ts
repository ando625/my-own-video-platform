import { describe, expect, it } from "vitest";
import { parseYoutubeVideoId } from "@/lib/youtube-url";

const VIDEO_ID = "dQw4w9WgXcQ";

describe("parseYoutubeVideoId", () => {
  it("UT-010: youtube.com/watch?v= 形式から動画IDを取り出せる", () => {
    expect(
      parseYoutubeVideoId(`https://www.youtube.com/watch?v=${VIDEO_ID}`),
    ).toBe(VIDEO_ID);
  });

  it("UT-011: youtu.be/ 形式から動画IDを取り出せる", () => {
    expect(parseYoutubeVideoId(`https://youtu.be/${VIDEO_ID}`)).toBe(VIDEO_ID);
  });

  it.each([
    `https://www.youtube.com/watch?v=${VIDEO_ID}&t=30s`,
    `https://www.youtube.com/watch?list=PL123&v=${VIDEO_ID}`,
    `https://youtu.be/${VIDEO_ID}?si=abc123&t=30`,
  ])("UT-012: 追加のパラメータ付きの %s から動画IDだけを取り出せる", (url) => {
    expect(parseYoutubeVideoId(url)).toBe(VIDEO_ID);
  });

  it.each([
    "https://example.com/watch?v=dQw4w9WgXcQ",
    "https://vimeo.com/123456789",
  ])("UT-013: YouTube以外の %s はエラーになる", (url) => {
    expect(() => parseYoutubeVideoId(url)).toThrow();
  });

  it.each([
    "",
    "   ",
    "動画",
    "https://www.youtube.com/",
    "https://www.youtube.com/watch",
    "https://www.youtube.com/watch?v=",
    "https://youtu.be/",
  ])("UT-014: 動画IDがない %j はエラーになる", (url) => {
    expect(() => parseYoutubeVideoId(url)).toThrow();
  });

  it.each([
    `https://youtube.com/watch?v=${VIDEO_ID}`,
    `https://m.youtube.com/watch?v=${VIDEO_ID}`,
    `http://www.youtube.com/watch?v=${VIDEO_ID}`,
    `http://youtu.be/${VIDEO_ID}`,
    `  https://youtu.be/${VIDEO_ID}  `,
  ])("UT-015: %j から動画IDを取り出せる", (url) => {
    expect(parseYoutubeVideoId(url)).toBe(VIDEO_ID);
  });

  it.each([
    `https://www.youtube.com/embed/${VIDEO_ID}`,
    `https://www.youtube.com/shorts/${VIDEO_ID}`,
  ])("UT-016: 対応していない形式の %s はエラーになる", (url) => {
    expect(() => parseYoutubeVideoId(url)).toThrow();
  });

  it.each([
    `https://youtube.com.example.com/watch?v=${VIDEO_ID}`,
    `https://notyoutube.com/watch?v=${VIDEO_ID}`,
    `https://example.com/youtu.be/${VIDEO_ID}`,
    `https://youtube.com@example.com/watch?v=${VIDEO_ID}`,
  ])("UT-017: 似た別のドメインの %s はエラーになる", (url) => {
    expect(() => parseYoutubeVideoId(url)).toThrow();
  });

  it.each([
    "https://youtu.be/short",
    "https://youtu.be/dQw4w9WgXcQ1",
    "https://www.youtube.com/watch?v=dQw4w9WgXc!",
    "https://www.youtube.com/watch?v=<script>abc",
    `https://youtu.be/${VIDEO_ID}/extra`,
  ])("UT-018: 動画IDの形式が不正な %s はエラーになる", (url) => {
    expect(() => parseYoutubeVideoId(url)).toThrow();
  });
});
