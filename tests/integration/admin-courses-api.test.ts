import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { POST as publishCourse } from "@/app/api/admin/courses/[courseId]/publish/route";
import {
  DELETE as deleteCourse,
  GET as getCourse,
  PATCH as patchCourse,
} from "@/app/api/admin/courses/[courseId]/route";
import { POST as unpublishCourse } from "@/app/api/admin/courses/[courseId]/unpublish/route";
import {
  GET as listCourses,
  POST as postCourse,
} from "@/app/api/admin/courses/route";
import { db } from "@/db";
import { courseProgress, courses, user } from "@/db/schema";
import { resetTestDatabase } from "./test-database";
import { createLoggedInCookie } from "./test-users";

const EXISTING_ID = "existing-course";
const VIDEO_ID = "dQw4w9WgXcQ";
const OTHER_VIDEO_ID = "9bZkp7q19f0";
const VIDEO_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;
const OTHER_VIDEO_URL = `https://youtu.be/${OTHER_VIDEO_ID}`;
const OLD_DATE = new Date("2020-01-01T00:00:00.000Z");

function buildRequest(
  method: string,
  options: { cookie?: string; body?: unknown; rawBody?: string } = {},
) {
  const headers = new Headers({ "content-type": "application/json" });
  if (options.cookie) {
    headers.set("cookie", options.cookie);
  }
  const body =
    options.rawBody ??
    (options.body === undefined ? undefined : JSON.stringify(options.body));
  return new Request("http://localhost:3000/api/admin/courses", {
    method,
    headers,
    body,
  });
}

const courseContext = (courseId: string) => ({
  params: Promise.resolve({ courseId }),
});

async function storedCourses() {
  return db.select().from(courses);
}

async function storedCourse(id: string) {
  const [course] = await db.select().from(courses).where(eq(courses.id, id));
  return course;
}

beforeEach(async () => {
  await resetTestDatabase();
  await db.insert(courses).values({
    id: EXISTING_ID,
    title: "既存の講座",
    youtubeVideoId: VIDEO_ID,
    updatedAt: OLD_DATE,
  });
});

const endpoints = [
  {
    name: "GET /api/admin/courses",
    call: (cookie?: string) => listCourses(buildRequest("GET", { cookie })),
  },
  {
    name: "POST /api/admin/courses",
    call: (cookie?: string) =>
      postCourse(
        buildRequest("POST", {
          cookie,
          body: { title: "新規", youtubeUrl: VIDEO_URL },
        }),
      ),
  },
  {
    name: "GET /api/admin/courses/[courseId]",
    call: (cookie?: string) =>
      getCourse(buildRequest("GET", { cookie }), courseContext(EXISTING_ID)),
  },
  {
    name: "PATCH /api/admin/courses/[courseId]",
    call: (cookie?: string) =>
      patchCourse(
        buildRequest("PATCH", { cookie, body: { title: "変更後" } }),
        courseContext(EXISTING_ID),
      ),
  },
  {
    name: "POST publish",
    call: (cookie?: string) =>
      publishCourse(
        buildRequest("POST", { cookie }),
        courseContext(EXISTING_ID),
      ),
  },
  {
    name: "POST unpublish",
    call: (cookie?: string) =>
      unpublishCourse(
        buildRequest("POST", { cookie }),
        courseContext(EXISTING_ID),
      ),
  },
  {
    name: "DELETE /api/admin/courses/[courseId]",
    call: (cookie?: string) =>
      deleteCourse(
        buildRequest("DELETE", { cookie }),
        courseContext(EXISTING_ID),
      ),
  },
];

describe.each(endpoints)("管理用APIの権限: $name", ({ call }) => {
  it("IT-001: 未ログインで呼ぶと401で拒否され、データは変わらない", async () => {
    const before = await storedCourses();

    const response = await call();

    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("UNAUTHORIZED");
    expect(await storedCourses()).toEqual(before);
  });

  it("IT-002: 管理者以外で呼ぶと403で拒否され、データは変わらない", async () => {
    const cookie = await createLoggedInCookie("member");
    const before = await storedCourses();

    const response = await call(cookie);

    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe("FORBIDDEN");
    expect(await storedCourses()).toEqual(before);
  });

  it("IT-003: 管理者で呼ぶと処理が成功する", async () => {
    const cookie = await createLoggedInCookie("admin");

    const response = await call(cookie);

    expect(response.ok).toBe(true);
  });
});

describe("講座の管理", () => {
  let cookie: string;

  beforeEach(async () => {
    cookie = await createLoggedInCookie("admin");
  });

  it("IT-060: タイトル、説明、YouTube URLで作成すると201を返し、動画IDと draft で保存される", async () => {
    const response = await postCourse(
      buildRequest("POST", {
        cookie,
        body: {
          title: "新しい講座",
          description: "講座の説明",
          youtubeUrl: VIDEO_URL,
        },
      }),
    );

    expect(response.status).toBe(201);
    const { course } = await response.json();
    const stored = await storedCourse(course.id);
    expect(stored.title).toBe("新しい講座");
    expect(stored.description).toBe("講座の説明");
    expect(stored.youtubeVideoId).toBe(VIDEO_ID);
    expect(stored.status).toBe("draft");
  });

  it.each([
    { title: "", youtubeUrl: VIDEO_URL },
    { title: "   ", youtubeUrl: VIDEO_URL },
    { youtubeUrl: VIDEO_URL },
    { title: 123, youtubeUrl: VIDEO_URL },
  ])("IT-061: 入力 %j では400を返し、保存されない", async (body) => {
    const before = await storedCourses();

    const response = await postCourse(buildRequest("POST", { cookie, body }));

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
    expect(await storedCourses()).toEqual(before);
  });

  it("IT-062: タイトル、説明、YouTube URLを修正すると保存され、updatedAt が更新される", async () => {
    const response = await patchCourse(
      buildRequest("PATCH", {
        cookie,
        body: {
          title: "修正後のタイトル",
          description: "修正後の説明",
          youtubeUrl: OTHER_VIDEO_URL,
        },
      }),
      courseContext(EXISTING_ID),
    );

    expect(response.status).toBe(200);
    const stored = await storedCourse(EXISTING_ID);
    expect(stored.title).toBe("修正後のタイトル");
    expect(stored.description).toBe("修正後の説明");
    expect(stored.youtubeVideoId).toBe(OTHER_VIDEO_ID);
    expect(stored.updatedAt.getTime()).toBeGreaterThan(OLD_DATE.getTime());
  });

  it("IT-063: 存在しない講座の取得、修正は404を返す", async () => {
    const getResponse = await getCourse(
      buildRequest("GET", { cookie }),
      courseContext("missing"),
    );
    const patchResponse = await patchCourse(
      buildRequest("PATCH", { cookie, body: { title: "変更" } }),
      courseContext("missing"),
    );

    expect(getResponse.status).toBe(404);
    expect((await getResponse.json()).error.code).toBe("NOT_FOUND");
    expect(patchResponse.status).toBe(404);
    expect((await patchResponse.json()).error.code).toBe("NOT_FOUND");
  });

  it("IT-065: 修正のリクエストで status を送っても status は変わらない", async () => {
    await patchCourse(
      buildRequest("PATCH", {
        cookie,
        body: { title: "変更", status: "published" },
      }),
      courseContext(EXISTING_ID),
    );

    expect((await storedCourse(EXISTING_ID)).status).toBe("draft");
  });

  it("IT-066: 管理用の一覧で draft と published の両方が返る", async () => {
    await db.insert(courses).values({
      id: "published-course",
      title: "公開中の講座",
      youtubeVideoId: VIDEO_ID,
      status: "published",
    });

    const response = await listCourses(buildRequest("GET", { cookie }));

    expect(response.status).toBe(200);
    const { courses: returned } = await response.json();
    const statuses = returned.map((course: { status: string }) => course.status);
    expect(statuses).toContain("draft");
    expect(statuses).toContain("published");
  });

  it("IT-067: JSONとして不正な内容を送ると400を返し、保存されない", async () => {
    const before = await storedCourses();

    const response = await postCourse(
      buildRequest("POST", { cookie, rawBody: "{不正なJSON" }),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
    expect(await storedCourses()).toEqual(before);
  });

  it.each([
    { title: "新規", youtubeUrl: "https://example.com/video" },
    { title: "新規", youtubeUrl: "" },
    { title: "新規" },
    { title: "新規", youtubeUrl: 123 },
  ])("IT-068: 作成時の入力 %j は400を返し、保存されない", async (body) => {
    const before = await storedCourses();

    const response = await postCourse(buildRequest("POST", { cookie, body }));

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
    expect(await storedCourses()).toEqual(before);
  });

  it("IT-069: 修正時のYouTube URLが不正だと400を返し、保存されない", async () => {
    const before = await storedCourses();

    const response = await patchCourse(
      buildRequest("PATCH", {
        cookie,
        body: { title: "修正後", youtubeUrl: "https://example.com/video" },
      }),
      courseContext(EXISTING_ID),
    );

    expect(response.status).toBe(400);
    expect(await storedCourses()).toEqual(before);
  });
});

describe("公開と削除", () => {
  let cookie: string;

  beforeEach(async () => {
    cookie = await createLoggedInCookie("admin");
  });

  it("IT-010: 下書きの講座を公開すると published になる", async () => {
    const response = await publishCourse(
      buildRequest("POST", { cookie }),
      courseContext(EXISTING_ID),
    );

    expect(response.status).toBe(200);
    expect((await storedCourse(EXISTING_ID)).status).toBe("published");
  });

  it("IT-013: 公開中の講座を下書きに戻すと draft になる", async () => {
    await db
      .update(courses)
      .set({ status: "published" })
      .where(eq(courses.id, EXISTING_ID));

    const response = await unpublishCourse(
      buildRequest("POST", { cookie }),
      courseContext(EXISTING_ID),
    );

    expect(response.status).toBe(200);
    expect((await storedCourse(EXISTING_ID)).status).toBe("draft");
  });

  it("IT-014: 存在しない講座の公開、下書きへの変更は404を返す", async () => {
    const published = await publishCourse(
      buildRequest("POST", { cookie }),
      courseContext("missing"),
    );
    const unpublished = await unpublishCourse(
      buildRequest("POST", { cookie }),
      courseContext("missing"),
    );

    expect(published.status).toBe(404);
    expect(unpublished.status).toBe(404);
  });

  it("IT-020: 講座を削除すると講座と進捗が消え、別の講座は残る", async () => {
    await db.insert(user).values({
      id: "learner",
      name: "受講者",
      email: "learner@example.com",
    });
    await db.insert(courses).values({
      id: "other-course",
      title: "別の講座",
      youtubeVideoId: VIDEO_ID,
    });
    for (const courseId of [EXISTING_ID, "other-course"]) {
      await db.insert(courseProgress).values({
        userId: "learner",
        courseId,
        completedAt: new Date(),
      });
    }

    const response = await deleteCourse(
      buildRequest("DELETE", { cookie }),
      courseContext(EXISTING_ID),
    );

    expect(response.status).toBe(200);
    const remaining = await storedCourses();
    expect(remaining.map((course) => course.id)).toEqual(["other-course"]);
    const progress = await db.select().from(courseProgress);
    expect(progress.map((row) => row.courseId)).toEqual(["other-course"]);
  });

  it("IT-027: 存在しない講座の削除は404を返す", async () => {
    const response = await deleteCourse(
      buildRequest("DELETE", { cookie }),
      courseContext("missing"),
    );

    expect(response.status).toBe(404);
  });
});
