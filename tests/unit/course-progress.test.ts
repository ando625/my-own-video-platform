import { describe, expect, it } from "vitest";
import { summarizeProgress } from "@/lib/course-progress";

describe("summarizeProgress", () => {
  it("UT-020: 全10本のうち3本が視聴済みなら、全体10、視聴済み3になる", () => {
    const courseIds = Array.from({ length: 10 }, (_, index) => `c${index}`);

    expect(summarizeProgress(courseIds, ["c0", "c1", "c2"])).toEqual({
      total: 10,
      completed: 3,
    });
  });

  it("UT-021: 講座が0本なら、エラーにならず全体0、視聴済み0になる", () => {
    expect(summarizeProgress([], [])).toEqual({ total: 0, completed: 0 });
  });
});
