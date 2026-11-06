import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import {
  DELETE as deleteProgress,
  PUT as putProgress,
} from "@/app/api/courses/[courseId]/progress/route";
import { db } from "@/db";
import { courseProgress, courses, user } from "@/db/schema";
import { getProgressSummary } from "@/services/progress-service";
import { resetTestDatabase } from "./test-database";
import { createLoggedInCookie } from "./test-users";

const OTHER_USER_ID = "other-user";
const MEMBER_ID = "it-member";

function buildRequest(method: string, cookie?: string, body?: unknown) {
  const headers = new Headers({ "content-type": "application/json" });
  if (cookie) {
    headers.set("cookie", cookie);
  }
  return new Request("http://localhost:3000/api/courses/test/progress", {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const courseContext = (courseId: string) => ({
  params: Promise.resolve({ courseId }),
});

async function createCourse(id: string, status: "draft" | "published") {
  await db.insert(courses).values({
    id,
    title: id,
    youtubeVideoId: "dQw4w9WgXcQ",
    status,
  });
}

async function progressRows() {
  return db.select().from(courseProgress);
}

describe("進捗の記録", () => {
  beforeEach(async () => {
    await resetTestDatabase();
    await db.insert(user).values({
      id: OTHER_USER_ID,
      name: "別のユーザー",
      email: "other@example.com",
    });
    await createCourse("first", "published");
    await createCourse("second", "published");
    await createCourse("draft", "draft");
  });

  it("IT-040: 未ログインの記録、取り消しは401で拒否され、記録は変わらない", async () => {
    await db.insert(courseProgress).values({
      userId: OTHER_USER_ID,
      courseId: "first",
      completedAt: new Date(),
    });
    const before = await progressRows();

    const put = await putProgress(buildRequest("PUT"), courseContext("second"));
    const remove = await deleteProgress(
      buildRequest("DELETE"),
      courseContext("first"),
    );

    expect(put.status).toBe(401);
    expect(remove.status).toBe(401);
    expect(await progressRows()).toEqual(before);
  });

  it("IT-041: ログイン済みで視聴済みにすると、自分の進捗だけが記録される", async () => {
    const cookie = await createLoggedInCookie("member");

    const response = await putProgress(
      buildRequest("PUT", cookie),
      courseContext("first"),
    );

    expect(response.status).toBe(200);
    const rows = await progressRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].userId).toBe(MEMBER_ID);
    expect(rows[0].courseId).toBe("first");
    expect(rows[0].completedAt).toBeInstanceOf(Date);
  });

  it("IT-042: 同じ講座を2回視聴済みにしても、1件のまま", async () => {
    const cookie = await createLoggedInCookie("member");

    const first = await putProgress(
      buildRequest("PUT", cookie),
      courseContext("first"),
    );
    const second = await putProgress(
      buildRequest("PUT", cookie),
      courseContext("first"),
    );

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(await progressRows()).toHaveLength(1);
  });

  it("IT-043: 視聴済みを取り消すと未視聴に戻る。未視聴の取り消しも成功する", async () => {
    const cookie = await createLoggedInCookie("member");
    await putProgress(buildRequest("PUT", cookie), courseContext("first"));

    const first = await deleteProgress(
      buildRequest("DELETE", cookie),
      courseContext("first"),
    );
    const second = await deleteProgress(
      buildRequest("DELETE", cookie),
      courseContext("first"),
    );

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(await progressRows()).toHaveLength(0);
  });

  it("IT-044: 別のユーザーのIDを送っても、自分以外の進捗は変更できない", async () => {
    const cookie = await createLoggedInCookie("member");
    await db.insert(courseProgress).values({
      userId: OTHER_USER_ID,
      courseId: "first",
      completedAt: new Date(),
    });

    await deleteProgress(
      buildRequest("DELETE", cookie, { userId: OTHER_USER_ID }),
      courseContext("first"),
    );
    await putProgress(
      buildRequest("PUT", cookie, { userId: OTHER_USER_ID }),
      courseContext("second"),
    );

    const otherRows = await db
      .select()
      .from(courseProgress)
      .where(eq(courseProgress.userId, OTHER_USER_ID));
    expect(otherRows.map((row) => row.courseId)).toEqual(["first"]);
    const memberRows = await db
      .select()
      .from(courseProgress)
      .where(eq(courseProgress.userId, MEMBER_ID));
    expect(memberRows.map((row) => row.courseId)).toEqual(["second"]);
  });

  it("IT-045: 下書きの講座で記録すると404で拒否される", async () => {
    const cookie = await createLoggedInCookie("member");

    const response = await putProgress(
      buildRequest("PUT", cookie),
      courseContext("draft"),
    );

    expect(response.status).toBe(404);
    expect(await progressRows()).toHaveLength(0);
  });

  it("IT-046: 存在しない講座の記録、取り消しは404を返す", async () => {
    const cookie = await createLoggedInCookie("member");

    const put = await putProgress(
      buildRequest("PUT", cookie),
      courseContext("missing"),
    );
    const remove = await deleteProgress(
      buildRequest("DELETE", cookie),
      courseContext("missing"),
    );

    expect(put.status).toBe(404);
    expect(remove.status).toBe(404);
  });

  it("IT-047: 集計は、公開中の講座についての自分の視聴済みだけを数える", async () => {
    await createLoggedInCookie("member");
    for (const [userId, courseId] of [
      [MEMBER_ID, "first"],
      [MEMBER_ID, "draft"],
      [OTHER_USER_ID, "second"],
    ]) {
      await db.insert(courseProgress).values({
        userId,
        courseId,
        completedAt: new Date(),
      });
    }

    const summary = await getProgressSummary(MEMBER_ID);

    expect(summary.total).toBe(2);
    expect(summary.completed).toBe(1);
    expect(summary.completedCourseIds).toEqual(["first"]);
  });
});
