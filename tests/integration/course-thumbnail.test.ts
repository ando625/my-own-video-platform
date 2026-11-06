import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { PATCH as patchCourse } from "@/app/api/admin/courses/[courseId]/route";
import { POST as postCourse } from "@/app/api/admin/courses/route";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { listPublishedCourses } from "@/services/catalog-service";
import { resetTestDatabase } from "./test-database";
import { createLoggedInCookie } from "./test-users";

const VIDEO_ID = "dQw4w9WgXcQ";
const VIDEO_URL = `https://youtu.be/${VIDEO_ID}`;

function buildRequest(method: string, cookie: string, body: unknown) {
  return new Request("http://localhost:3000/api/admin/courses", {
    method,
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify(body),
  });
}

const courseContext = (courseId: string) => ({
  params: Promise.resolve({ courseId }),
});

async function storedCourse(id: string) {
  const [course] = await db.select().from(courses).where(eq(courses.id, id));
  return course;
}

describe("サムネイルのデータ", () => {
  let cookie: string;

  beforeEach(async () => {
    await resetTestDatabase();
    cookie = await createLoggedInCookie("admin");
    await db.insert(courses).values({
      id: "existing",
      title: "既存の講座",
      youtubeVideoId: VIDEO_ID,
      thumbnailFileName: "before.png",
      status: "published",
    });
  });

  it("IT-070: サムネイルのファイル名を付けて作成、修正すると保存される", async () => {
    const created = await postCourse(
      buildRequest("POST", cookie, {
        title: "新規",
        youtubeUrl: VIDEO_URL,
        thumbnailFileName: "course_1-a.webp",
      }),
    );
    const { course } = await created.json();
    expect((await storedCourse(course.id)).thumbnailFileName).toBe(
      "course_1-a.webp",
    );

    const updated = await patchCourse(
      buildRequest("PATCH", cookie, { thumbnailFileName: "after.jpg" }),
      courseContext("existing"),
    );
    expect(updated.status).toBe(200);
    expect((await storedCourse("existing")).thumbnailFileName).toBe("after.jpg");
  });

  it.each([
    "/thumbnails/course.png",
    "../course.png",
    "sub/course.png",
    "https://example.com/course.png",
    "course.gif",
    "course",
    ".png",
    "コース.png",
  ])("IT-071: 不正なファイル名 %s は400を返し、保存されない", async (name) => {
    const response = await patchCourse(
      buildRequest("PATCH", cookie, { thumbnailFileName: name }),
      courseContext("existing"),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
    expect((await storedCourse("existing")).thumbnailFileName).toBe(
      "before.png",
    );
  });

  it("IT-072: サムネイルのファイル名を空で保存すると未指定になる", async () => {
    const response = await patchCourse(
      buildRequest("PATCH", cookie, { thumbnailFileName: "" }),
      courseContext("existing"),
    );

    expect(response.status).toBe(200);
    expect((await storedCourse("existing")).thumbnailFileName).toBeNull();
  });

  it("IT-056: 受講者向けの一覧でサムネイルのファイル名と動画IDが返る", async () => {
    const [course] = await listPublishedCourses();

    expect(course.thumbnailFileName).toBe("before.png");
    expect(course.youtubeVideoId).toBe(VIDEO_ID);
  });
});
