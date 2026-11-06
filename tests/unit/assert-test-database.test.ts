import { describe, expect, it } from "vitest";
import { assertTestDatabase } from "../assert-test-database";

describe("assertTestDatabase", () => {
  it("UT-030: .test フォルダ内のローカルファイルは許可される", () => {
    expect(() => assertTestDatabase("file:.test/vitest.db")).not.toThrow();
  });

  it("UT-031: Turso の接続先はエラーで止まる", () => {
    expect(() =>
      assertTestDatabase("libsql://example.turso.io"),
    ).toThrow();
  });

  it.each([
    "file:local.db",
    "file:.test/../local.db",
    "file:/tmp/test.db",
    "",
    undefined,
  ])("UT-032: 接続先 %j はエラーで止まる", (url) => {
    expect(() => assertTestDatabase(url)).toThrow();
  });
});
