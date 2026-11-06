import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { GET as getCourse } from "@/app/api/admin/courses/[courseId]/route";
import { POST as postSection } from "@/app/api/admin/courses/[courseId]/sections/route";
import { PATCH as patchLesson } from "@/app/api/admin/lessons/[lessonId]/route";
import { POST as postLesson } from "@/app/api/admin/sections/[sectionId]/lessons/route";
import { PATCH as patchSection } from "@/app/api/admin/sections/[sectionId]/route";
import { db } from "@/db";
import { courses, lessons, sections } from "@/db/schema";
import { resetTestDatabase } from "./test-database";
import { createLoggedInCookie } from "./test-users";

const COURSE_ID = "course-1";
const SECTION_ID = "section-1";
const LESSON_ID = "lesson-1";
const VIDEO_ID = "dQw4w9WgXcQ";
const OTHER_VIDEO_ID = "9bZkp7q19f0";
const VIDEO_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;
const OTHER_VIDEO_URL = `https://youtu.be/${OTHER_VIDEO_ID}`;

function buildRequest(method: string, cookie?: string, body?: unknown) {
  const headers = new Headers({ "content-type": "application/json" });
  if (cookie) {
    headers.set("cookie", cookie);
  }
  return new Request("http://localhost:3000/api/admin/test", {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const courseContext = (courseId: string) => ({
  params: Promise.resolve({ courseId }),
});
const sectionContext = (sectionId: string) => ({
  params: Promise.resolve({ sectionId }),
});
const lessonContext = (lessonId: string) => ({
  params: Promise.resolve({ lessonId }),
});

async function allRows() {
  return {
    sections: await db.select().from(sections),
    lessons: await db.select().from(lessons),
  };
}

beforeEach(async () => {
  await resetTestDatabase();
  await db.insert(courses).values({ id: COURSE_ID, title: "コース" });
  await db.insert(sections).values({
    id: SECTION_ID,
    courseId: COURSE_ID,
    title: "セクション",
    position: 1,
  });
  await db.insert(lessons).values({
    id: LESSON_ID,
    sectionId: SECTION_ID,
    title: "レッスン",
    youtubeVideoId: VIDEO_ID,
    position: 1,
  });
});

const endpoints = [
  {
    name: "POST sections",
    call: (cookie?: string) =>
      postSection(
        buildRequest("POST", cookie, { title: "追加" }),
        courseContext(COURSE_ID),
      ),
  },
  {
    name: "PATCH sections",
    call: (cookie?: string) =>
      patchSection(
        buildRequest("PATCH", cookie, { title: "変更" }),
        sectionContext(SECTION_ID),
      ),
  },
  {
    name: "POST lessons",
    call: (cookie?: string) =>
      postLesson(
        buildRequest("POST", cookie, { title: "追加", youtubeUrl: VIDEO_URL }),
        sectionContext(SECTION_ID),
      ),
  },
  {
    name: "PATCH lessons",
    call: (cookie?: string) =>
      patchLesson(
        buildRequest("PATCH", cookie, { title: "変更" }),
        lessonContext(LESSON_ID),
      ),
  },
];

describe.each(endpoints)("管理用APIの権限: $name", ({ call }) => {
  it("IT-001: 未ログインで呼ぶと401で拒否され、データは変わらない", async () => {
    const before = await allRows();

    const response = await call();

    expect(response.status).toBe(401);
    expect(await allRows()).toEqual(before);
  });

  it("IT-002: 管理者以外で呼ぶと403で拒否され、データは変わらない", async () => {
    const cookie = await createLoggedInCookie("member");
    const before = await allRows();

    const response = await call(cookie);

    expect(response.status).toBe(403);
    expect(await allRows()).toEqual(before);
  });

  it("IT-003: 管理者で呼ぶと処理が成功する", async () => {
    const cookie = await createLoggedInCookie("admin");

    const response = await call(cookie);

    expect(response.ok).toBe(true);
  });
});

describe("セクションとレッスンの管理", () => {
  let cookie: string;

  beforeEach(async () => {
    cookie = await createLoggedInCookie("admin");
  });

  it("IT-070: セクションを続けて2つ作成すると、作成順に最後へ追加される", async () => {
    const first = await postSection(
      buildRequest("POST", cookie, { title: "2番目" }),
      courseContext(COURSE_ID),
    );
    const second = await postSection(
      buildRequest("POST", cookie, { title: "3番目" }),
      courseContext(COURSE_ID),
    );

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    const stored = await db
      .select()
      .from(sections)
      .where(eq(sections.courseId, COURSE_ID))
      .orderBy(sections.position);
    expect(stored.map((section) => section.title)).toEqual([
      "セクション",
      "2番目",
      "3番目",
    ]);
  });

  it.each([{ title: "" }, { title: "   " }, {}])(
    "IT-071: セクションの入力 %j は400を返し、保存されない",
    async (body) => {
      const before = await allRows();

      const response = await postSection(
        buildRequest("POST", cookie, body),
        courseContext(COURSE_ID),
      );

      expect(response.status).toBe(400);
      expect(await allRows()).toEqual(before);
    },
  );

  it("IT-072: 存在しないコースにセクションを作成すると404を返す", async () => {
    const response = await postSection(
      buildRequest("POST", cookie, { title: "追加" }),
      courseContext("missing"),
    );

    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("NOT_FOUND");
  });

  it("IT-073: セクションのタイトルを修正すると保存される", async () => {
    const response = await patchSection(
      buildRequest("PATCH", cookie, { title: "修正後" }),
      sectionContext(SECTION_ID),
    );

    expect(response.status).toBe(200);
    const [stored] = await db
      .select()
      .from(sections)
      .where(eq(sections.id, SECTION_ID));
    expect(stored.title).toBe("修正後");
  });

  it("IT-074: 存在しないセクションを修正すると404を返す", async () => {
    const response = await patchSection(
      buildRequest("PATCH", cookie, { title: "修正後" }),
      sectionContext("missing"),
    );

    expect(response.status).toBe(404);
  });

  it("IT-075: YouTube URLからレッスンを続けて2本作成すると、動画IDが保存され最後へ追加される", async () => {
    const first = await postLesson(
      buildRequest("POST", cookie, { title: "2本目", youtubeUrl: VIDEO_URL }),
      sectionContext(SECTION_ID),
    );
    const second = await postLesson(
      buildRequest("POST", cookie, {
        title: "3本目",
        youtubeUrl: OTHER_VIDEO_URL,
      }),
      sectionContext(SECTION_ID),
    );

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    const stored = await db
      .select()
      .from(lessons)
      .where(eq(lessons.sectionId, SECTION_ID))
      .orderBy(lessons.position);
    expect(stored.map((lesson) => lesson.title)).toEqual([
      "レッスン",
      "2本目",
      "3本目",
    ]);
    expect(stored[1].youtubeVideoId).toBe(VIDEO_ID);
    expect(stored[2].youtubeVideoId).toBe(OTHER_VIDEO_ID);
  });

  it.each([
    { title: "追加", youtubeUrl: "https://example.com/video" },
    { title: "追加", youtubeUrl: "" },
    { title: "追加" },
    { title: "追加", youtubeUrl: 123 },
  ])("IT-076: レッスンの入力 %j は400を返し、保存されない", async (body) => {
    const before = await allRows();

    const response = await postLesson(
      buildRequest("POST", cookie, body),
      sectionContext(SECTION_ID),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
    expect(await allRows()).toEqual(before);
  });

  it.each([
    { title: "", youtubeUrl: VIDEO_URL },
    { title: "   ", youtubeUrl: VIDEO_URL },
    { youtubeUrl: VIDEO_URL },
  ])("IT-077: レッスンの入力 %j は400を返し、保存されない", async (body) => {
    const before = await allRows();

    const response = await postLesson(
      buildRequest("POST", cookie, body),
      sectionContext(SECTION_ID),
    );

    expect(response.status).toBe(400);
    expect(await allRows()).toEqual(before);
  });

  it("IT-078: 存在しないセクションにレッスンを作成すると404を返す", async () => {
    const response = await postLesson(
      buildRequest("POST", cookie, { title: "追加", youtubeUrl: VIDEO_URL }),
      sectionContext("missing"),
    );

    expect(response.status).toBe(404);
  });

  it("IT-079: レッスンのタイトルとYouTube URLを修正すると保存され、動画IDが変わる", async () => {
    const response = await patchLesson(
      buildRequest("PATCH", cookie, {
        title: "修正後",
        youtubeUrl: OTHER_VIDEO_URL,
      }),
      lessonContext(LESSON_ID),
    );

    expect(response.status).toBe(200);
    const [stored] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, LESSON_ID));
    expect(stored.title).toBe("修正後");
    expect(stored.youtubeVideoId).toBe(OTHER_VIDEO_ID);
  });

  it("IT-080: レッスンの修正でYouTube URLが不正だと400を返し、保存されない", async () => {
    const before = await allRows();

    const response = await patchLesson(
      buildRequest("PATCH", cookie, {
        title: "修正後",
        youtubeUrl: "https://example.com/video",
      }),
      lessonContext(LESSON_ID),
    );

    expect(response.status).toBe(400);
    expect(await allRows()).toEqual(before);
  });

  it("IT-081: 存在しないレッスンを修正すると404を返す", async () => {
    const response = await patchLesson(
      buildRequest("PATCH", cookie, { title: "修正後" }),
      lessonContext("missing"),
    );

    expect(response.status).toBe(404);
  });

  it("IT-082: コースを取得すると、セクションとレッスンが並び順で返る", async () => {
    await db.insert(sections).values({
      id: "section-0",
      courseId: COURSE_ID,
      title: "先頭のセクション",
      position: 0,
    });
    await db.insert(lessons).values({
      id: "lesson-0",
      sectionId: SECTION_ID,
      title: "先頭のレッスン",
      youtubeVideoId: VIDEO_ID,
      position: 0,
    });

    const response = await getCourse(
      buildRequest("GET", cookie),
      courseContext(COURSE_ID),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.course.id).toBe(COURSE_ID);
    expect(
      body.sections.map((section: { title: string }) => section.title),
    ).toEqual(["先頭のセクション", "セクション"]);
    expect(
      body.sections[1].lessons.map((lesson: { title: string }) => lesson.title),
    ).toEqual(["先頭のレッスン", "レッスン"]);
  });

  it("IT-083: 修正のリクエストで親のIDや position を送っても変わらない", async () => {
    await db.insert(courses).values({ id: "course-2", title: "別のコース" });
    await db.insert(sections).values({
      id: "section-2",
      courseId: "course-2",
      title: "別のセクション",
      position: 1,
    });

    await patchSection(
      buildRequest("PATCH", cookie, {
        title: "修正後",
        courseId: "course-2",
        position: 99,
      }),
      sectionContext(SECTION_ID),
    );
    await patchLesson(
      buildRequest("PATCH", cookie, {
        title: "修正後",
        sectionId: "section-2",
        position: 99,
      }),
      lessonContext(LESSON_ID),
    );

    const [section] = await db
      .select()
      .from(sections)
      .where(eq(sections.id, SECTION_ID));
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, LESSON_ID));
    expect(section.courseId).toBe(COURSE_ID);
    expect(section.position).toBe(1);
    expect(lesson.sectionId).toBe(SECTION_ID);
    expect(lesson.position).toBe(1);
  });
});
