import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import {
  GET as getCourse,
  PATCH as patchCourse,
} from "@/app/api/admin/courses/[courseId]/route";
import {
  GET as listCourses,
  POST as postCourse,
} from "@/app/api/admin/courses/route";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { resetTestDatabase } from "./test-database";
import { createLoggedInCookie } from "./test-users";

const BASE_URL = "http://localhost:3000/api/admin/courses";
const EXISTING_ID = "existing-course";

function buildRequest(
  method: string,
  options: { cookie?: string; body?: unknown; rawBody?: string; id?: string } = {},
) {
  const headers = new Headers({ "content-type": "application/json" });
  if (options.cookie) {
    headers.set("cookie", options.cookie);
  }
  const url = options.id ? `${BASE_URL}/${options.id}` : BASE_URL;
  const body =
    options.rawBody ??
    (options.body === undefined ? undefined : JSON.stringify(options.body));
  return new Request(url, { method, headers, body });
}

function courseContext(courseId: string) {
  return { params: Promise.resolve({ courseId }) };
}

async function storedCourses() {
  return db.select().from(courses);
}

beforeEach(async () => {
  await resetTestDatabase();
  await db.insert(courses).values({
    id: EXISTING_ID,
    title: "既存のコース",
    updatedAt: new Date("2020-01-01T00:00:00.000Z"),
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
      postCourse(buildRequest("POST", { cookie, body: { title: "新規" } })),
  },
  {
    name: "GET /api/admin/courses/[courseId]",
    call: (cookie?: string) =>
      getCourse(
        buildRequest("GET", { cookie, id: EXISTING_ID }),
        courseContext(EXISTING_ID),
      ),
  },
  {
    name: "PATCH /api/admin/courses/[courseId]",
    call: (cookie?: string) =>
      patchCourse(
        buildRequest("PATCH", {
          cookie,
          id: EXISTING_ID,
          body: { title: "変更後" },
        }),
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

describe("コースの管理", () => {
  let cookie: string;

  beforeEach(async () => {
    cookie = await createLoggedInCookie("admin");
  });

  it("IT-060: タイトルだけでコースを作成すると201を返し、draft で保存される", async () => {
    const response = await postCourse(
      buildRequest("POST", { cookie, body: { title: "新しいコース" } }),
    );

    expect(response.status).toBe(201);
    const { course } = await response.json();
    expect(course.title).toBe("新しいコース");
    expect(course.status).toBe("draft");
    expect(course.id).toEqual(expect.any(String));

    const [stored] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, course.id));
    expect(stored.title).toBe("新しいコース");
    expect(stored.status).toBe("draft");
  });

  it.each([{ title: "" }, { title: "   " }, {}, { title: 123 }])(
    "IT-061: 入力 %j では400を返し、保存されない",
    async (body) => {
      const before = await storedCourses();

      const response = await postCourse(
        buildRequest("POST", { cookie, body }),
      );

      expect(response.status).toBe(400);
      expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
      expect(await storedCourses()).toEqual(before);
    },
  );

  it("IT-062: タイトル、説明、サムネイルを修正すると保存され、updatedAt が更新される", async () => {
    const response = await patchCourse(
      buildRequest("PATCH", {
        cookie,
        id: EXISTING_ID,
        body: {
          title: "修正後のタイトル",
          description: "修正後の説明",
          thumbnailPath: "/thumbnails/course-1.png",
        },
      }),
      courseContext(EXISTING_ID),
    );

    expect(response.status).toBe(200);
    const [stored] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, EXISTING_ID));
    expect(stored.title).toBe("修正後のタイトル");
    expect(stored.description).toBe("修正後の説明");
    expect(stored.thumbnailPath).toBe("/thumbnails/course-1.png");
    expect(stored.updatedAt.getTime()).toBeGreaterThan(
      new Date("2020-01-01T00:00:00.000Z").getTime(),
    );
  });

  it("IT-063: 存在しないコースの取得、修正は404を返す", async () => {
    const getResponse = await getCourse(
      buildRequest("GET", { cookie, id: "missing" }),
      courseContext("missing"),
    );
    const patchResponse = await patchCourse(
      buildRequest("PATCH", {
        cookie,
        id: "missing",
        body: { title: "変更" },
      }),
      courseContext("missing"),
    );

    expect(getResponse.status).toBe(404);
    expect((await getResponse.json()).error.code).toBe("NOT_FOUND");
    expect(patchResponse.status).toBe(404);
    expect((await patchResponse.json()).error.code).toBe("NOT_FOUND");
  });

  it.each([
    "https://example.com/image.png",
    "/images/course-1.png",
    "/thumbnails/../secret.png",
    "thumbnails/course-1.png",
  ])("IT-064: サムネイル %s は400を返し、保存されない", async (thumbnailPath) => {
    const before = await storedCourses();

    const response = await patchCourse(
      buildRequest("PATCH", {
        cookie,
        id: EXISTING_ID,
        body: { thumbnailPath },
      }),
      courseContext(EXISTING_ID),
    );

    expect(response.status).toBe(400);
    expect(await storedCourses()).toEqual(before);
  });

  it("IT-065: 修正のリクエストで status を送っても status は変わらない", async () => {
    await patchCourse(
      buildRequest("PATCH", {
        cookie,
        id: EXISTING_ID,
        body: { title: "変更", status: "published" },
      }),
      courseContext(EXISTING_ID),
    );

    const [stored] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, EXISTING_ID));
    expect(stored.status).toBe("draft");
  });

  it("IT-066: 管理用のコース一覧で draft と published の両方が返る", async () => {
    await db.insert(courses).values({
      id: "published-course",
      title: "公開中のコース",
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
});
