import { describe, expect, it } from "vitest";
import { isAdminEmail } from "@/lib/admin-email";

describe("isAdminEmail", () => {
  it("UT-001: 確認済みのメールが ADMIN_EMAIL と一致すると管理者になる", () => {
    expect(isAdminEmail("admin@example.com", true, "admin@example.com")).toBe(
      true,
    );
  });

  it("UT-002: 前後の空白や大文字小文字だけが異なっても管理者になる", () => {
    expect(isAdminEmail(" ADMIN@example.com ", true, "admin@EXAMPLE.com ")).toBe(
      true,
    );
  });

  it("UT-003: メールが未確認だと管理者にならない", () => {
    expect(isAdminEmail("admin@example.com", false, "admin@example.com")).toBe(
      false,
    );
  });

  it("UT-004: メールが ADMIN_EMAIL と異なると管理者にならない", () => {
    expect(isAdminEmail("user@example.com", true, "admin@example.com")).toBe(
      false,
    );
  });

  it.each([undefined, "", "   "])(
    "UT-005: ADMIN_EMAIL が %j だと誰も管理者にならない",
    (adminEmail) => {
      expect(isAdminEmail("admin@example.com", true, adminEmail)).toBe(false);
      expect(isAdminEmail("", true, adminEmail)).toBe(false);
    },
  );
});
