import { asc, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { POST as publishCourse } from "@/app/api/admin/courses/[courseId]/publish/route";
import { DELETE as deleteCourse } from "@/app/api/admin/courses/[courseId]/route";
import { POST as unpublishCourse } from "@/app/api/admin/courses/[courseId]/unpublish/route";
import { POST as moveLesson } from "@/app/api/admin/lessons/[lessonId]/move/route";
import { DELETE as deleteLesson } from "@/app/api/admin/lessons/[lessonId]/route";
import { POST as moveSection } from "@/app/api/admin/sections/[sectionId]/move/route";
import { POST as postLesson } from "@/app/api/admin/sections/[sectionId]/lessons/route";
import { DELETE as deleteSection } from "@/app/api/admin/sections/[sectionId]/route";
import { db } from "@/db";
import { courses, lessonProgress, lessons, sections, user } from "@/db/schema";
import { resetTestDatabase } from "./test-database";
import { createLoggedInCookie } from "./test-users";

const VIDEO_ID = "dQw4w9WgXcQ";

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

async function createCourse(
  id: string,
  options: {
    status?: "draft" | "published";
    sections?: string[][];
  } = {},
) {
  await db
    .insert(courses)
    .values({ id, title: id, status: options.status ?? "draft" });
  for (const [sectionIndex, lessonIds] of (options.sections ?? []).entries()) {
    const sectionId = `${id}-s${sectionIndex + 1}`;
    await db.insert(sections).values({
      id: sectionId,
      courseId: id,
      title: sectionId,
      position: sectionIndex + 1,
    });
    for (const [lessonIndex, lessonId] of lessonIds.entries()) {
      await db.insert(lessons).values({
        id: lessonId,
        sectionId,
        title: lessonId,
        youtubeVideoId: VIDEO_ID,
        position: lessonIndex + 1,
      });
    }
  }
}

async function courseStatus(courseId: string) {
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId));
  return course?.status;
}

async function allRows() {
  return {
    courses: await db.select().from(courses),
    sections: await db.select().from(sections),
    lessons: await db.select().from(lessons),
  };
}

async function sectionOrder(courseId: string) {
  const rows = await db
    .select()
    .from(sections)
    .where(eq(sections.courseId, courseId))
    .orderBy(asc(sections.position));
  return rows.map((row) => row.id);
}

async function lessonOrder(sectionId: string) {
  const rows = await db
    .select()
    .from(lessons)
    .where(eq(lessons.sectionId, sectionId))
    .orderBy(asc(lessons.position));
  return rows.map((row) => row.id);
}

beforeEach(async () => {
  await resetTestDatabase();
});

const endpoints = [
  {
    name: "publish",
    call: (cookie?: string) =>
      publishCourse(buildRequest("POST", cookie), courseContext("guard")),
  },
  {
    name: "unpublish",
    call: (cookie?: string) =>
      unpublishCourse(buildRequest("POST", cookie), courseContext("guard")),
  },
  {
    name: "delete lesson",
    call: (cookie?: string) =>
      deleteLesson(buildRequest("DELETE", cookie), lessonContext("guard-l2")),
  },
  {
    name: "delete section",
    call: (cookie?: string) =>
      deleteSection(buildRequest("DELETE", cookie), sectionContext("guard-s2")),
  },
  {
    name: "delete course",
    call: (cookie?: string) =>
      deleteCourse(buildRequest("DELETE", cookie), courseContext("guard")),
  },
  {
    name: "move section",
    call: (cookie?: string) =>
      moveSection(
        buildRequest("POST", cookie, { direction: "down" }),
        sectionContext("guard-s1"),
      ),
  },
  {
    name: "move lesson",
    call: (cookie?: string) =>
      moveLesson(
        buildRequest("POST", cookie, { direction: "down" }),
        lessonContext("guard-l1"),
      ),
  },
];

describe.each(endpoints)("管理用APIの権限: $name", ({ call }) => {
  beforeEach(async () => {
    await createCourse("guard", {
      sections: [["guard-l1", "guard-l2"], ["guard-l3"]],
    });
  });

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

describe("公開と削除、並び替えのルール", () => {
  let cookie: string;

  beforeEach(async () => {
    cookie = await createLoggedInCookie("admin");
  });

  const publish = (courseId: string) =>
    publishCourse(buildRequest("POST", cookie), courseContext(courseId));
  const removeLesson = (lessonId: string) =>
    deleteLesson(buildRequest("DELETE", cookie), lessonContext(lessonId));
  const removeSection = (sectionId: string) =>
    deleteSection(buildRequest("DELETE", cookie), sectionContext(sectionId));
  const shiftSection = (sectionId: string, direction: unknown) =>
    moveSection(
      buildRequest("POST", cookie, { direction }),
      sectionContext(sectionId),
    );
  const shiftLesson = (lessonId: string, direction: unknown) =>
    moveLesson(
      buildRequest("POST", cookie, { direction }),
      lessonContext(lessonId),
    );

  it("IT-010: レッスンが1本以上あるコースを公開すると published になる", async () => {
    await createCourse("c1", { sections: [["l1"]] });

    const response = await publish("c1");

    expect(response.status).toBe(200);
    expect(await courseStatus("c1")).toBe("published");
  });

  it.each([
    { name: "セクションなし", sections: [] },
    { name: "レッスンのないセクションのみ", sections: [[], []] },
  ])("IT-011: レッスンが0本（$name）のコースは409で拒否され、draft のまま", async ({ sections: courseSections }) => {
    await createCourse("c1", { sections: courseSections });

    const response = await publish("c1");

    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("CONFLICT");
    expect(await courseStatus("c1")).toBe("draft");
  });

  it("IT-012: サムネイルが未指定でも、レッスンがあれば公開できる", async () => {
    await createCourse("c1", { sections: [["l1"]] });

    const [before] = await db.select().from(courses);
    expect(before.thumbnailPath).toBeNull();

    const response = await publish("c1");

    expect(response.status).toBe(200);
    expect(await courseStatus("c1")).toBe("published");
  });

  it("IT-013: 公開中のコースを下書きに戻すと draft になる", async () => {
    await createCourse("c1", { status: "published", sections: [["l1"]] });

    const response = await unpublishCourse(
      buildRequest("POST", cookie),
      courseContext("c1"),
    );

    expect(response.status).toBe(200);
    expect(await courseStatus("c1")).toBe("draft");
  });

  it("IT-014: 存在しないコースの公開、下書きへの変更は404を返す", async () => {
    const published = await publish("missing");
    const unpublished = await unpublishCourse(
      buildRequest("POST", cookie),
      courseContext("missing"),
    );

    expect(published.status).toBe(404);
    expect(unpublished.status).toBe(404);
  });

  it("IT-023: 公開中のコースで最後のレッスンの削除は409で拒否され、データは変わらない", async () => {
    await createCourse("c1", { status: "published", sections: [["l1"]] });
    const before = await allRows();

    const response = await removeLesson("l1");

    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("CONFLICT");
    expect(await allRows()).toEqual(before);
  });

  it("IT-024: 公開中のコースで最後のレッスンを含むセクションの削除は409で拒否される", async () => {
    await createCourse("c1", {
      status: "published",
      sections: [["l1", "l2"], []],
    });
    const before = await allRows();

    const response = await removeSection("c1-s1");

    expect(response.status).toBe(409);
    expect(await allRows()).toEqual(before);
  });

  it("IT-025: 下書きのコースでは最後のレッスンを削除できる", async () => {
    await createCourse("c1", { sections: [["l1"]] });

    const response = await removeLesson("l1");

    expect(response.status).toBe(200);
    expect(await db.select().from(lessons)).toHaveLength(0);
  });

  it("IT-026: 公開中のコースでも、ほかにレッスンが残る削除はできる", async () => {
    await createCourse("c1", {
      status: "published",
      sections: [["l1", "l2"], ["l3"], []],
    });

    const lessonResponse = await removeLesson("l1");
    const sectionResponse = await removeSection("c1-s1");
    const emptySectionResponse = await removeSection("c1-s3");

    expect(lessonResponse.status).toBe(200);
    expect(sectionResponse.status).toBe(200);
    expect(emptySectionResponse.status).toBe(200);
    const remaining = await db.select().from(lessons);
    expect(remaining.map((lesson) => lesson.id)).toEqual(["l3"]);
  });

  it("IT-027: 存在しないコース、セクション、レッスンの削除は404を返す", async () => {
    const course = await deleteCourse(
      buildRequest("DELETE", cookie),
      courseContext("missing"),
    );
    const section = await removeSection("missing");
    const lesson = await removeLesson("missing");

    expect(course.status).toBe(404);
    expect(section.status).toBe(404);
    expect(lesson.status).toBe(404);
  });

  it("IT-028: 削除APIでコース、セクション、レッスンを消すと配下のデータも消える", async () => {
    await db.insert(user).values({
      id: "learner",
      name: "受講者",
      email: "learner@example.com",
    });
    await createCourse("c1", { sections: [["l1", "l2"], ["l3"]] });
    await createCourse("c2", { sections: [["l4"]] });
    for (const lessonId of ["l1", "l2", "l3", "l4"]) {
      await db.insert(lessonProgress).values({
        userId: "learner",
        lessonId,
        completedAt: new Date(),
      });
    }

    expect((await removeLesson("l1")).status).toBe(200);
    expect((await removeSection("c1-s1")).status).toBe(200);
    expect(
      (
        await deleteCourse(buildRequest("DELETE", cookie), courseContext("c1"))
      ).status,
    ).toBe(200);

    const rows = await allRows();
    expect(rows.courses.map((course) => course.id)).toEqual(["c2"]);
    expect(rows.sections.map((section) => section.id)).toEqual(["c2-s1"]);
    expect(rows.lessons.map((lesson) => lesson.id)).toEqual(["l4"]);
    const progress = await db.select().from(lessonProgress);
    expect(progress.map((row) => row.lessonId)).toEqual(["l4"]);
  });

  it("IT-030: 2番目を上へ動かすと1番目と入れ替わる", async () => {
    await createCourse("c1", { sections: [[], [], []] });

    const response = await shiftSection("c1-s2", "up");

    expect(response.status).toBe(200);
    expect(await sectionOrder("c1")).toEqual(["c1-s2", "c1-s1", "c1-s3"]);
  });

  it("IT-031: 先頭を上へ、末尾を下へ動かしても順番は変わらない", async () => {
    await createCourse("c1", { sections: [[], [], []] });

    const first = await shiftSection("c1-s1", "up");
    const last = await shiftSection("c1-s3", "down");

    expect(first.status).toBe(200);
    expect(last.status).toBe(200);
    expect(await sectionOrder("c1")).toEqual(["c1-s1", "c1-s2", "c1-s3"]);
  });

  it("IT-032: 動かしても別のコースの順番は変わらない", async () => {
    await createCourse("c1", { sections: [[], []] });
    await createCourse("c2", { sections: [[], []] });

    await shiftSection("c1-s2", "up");

    expect(await sectionOrder("c1")).toEqual(["c1-s2", "c1-s1"]);
    expect(await sectionOrder("c2")).toEqual(["c2-s1", "c2-s2"]);
  });

  it.each(["left", "", 1, null])(
    "IT-033: 並び替えの方向 %j は400を返し、順番は変わらない",
    async (direction) => {
      await createCourse("c1", { sections: [[], []] });

      const response = await shiftSection("c1-s2", direction);

      expect(response.status).toBe(400);
      expect(await sectionOrder("c1")).toEqual(["c1-s1", "c1-s2"]);
    },
  );

  it("IT-034: 存在しないセクション、レッスンを動かすと404を返す", async () => {
    expect((await shiftSection("missing", "up")).status).toBe(404);
    expect((await shiftLesson("missing", "up")).status).toBe(404);
  });

  it("IT-035: 途中の項目を削除した後でも順番が保たれ、追加は最後になる", async () => {
    await createCourse("c1", { sections: [["l1", "l2", "l3"]] });

    await removeLesson("l2");
    expect((await shiftLesson("l3", "up")).status).toBe(200);
    expect(await lessonOrder("c1-s1")).toEqual(["l3", "l1"]);

    const created = await postLesson(
      buildRequest("POST", cookie, {
        title: "追加",
        youtubeUrl: `https://youtu.be/${VIDEO_ID}`,
      }),
      sectionContext("c1-s1"),
    );
    const { lesson } = await created.json();
    expect(await lessonOrder("c1-s1")).toEqual(["l3", "l1", lesson.id]);
  });

  it("IT-036: レッスンは同じセクションの中で入れ替わり、別のセクションは変わらない", async () => {
    await createCourse("c1", { sections: [["l1", "l2"], ["l3", "l4"]] });

    const response = await shiftLesson("l1", "down");

    expect(response.status).toBe(200);
    expect(await lessonOrder("c1-s1")).toEqual(["l2", "l1"]);
    expect(await lessonOrder("c1-s2")).toEqual(["l3", "l4"]);

    await shiftLesson("l2", "up");
    expect(await lessonOrder("c1-s1")).toEqual(["l2", "l1"]);
  });
});
