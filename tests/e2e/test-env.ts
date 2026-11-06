// E2E テスト専用の値。本物の秘密情報は入れない。
export const E2E_PORT = 3100;
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;
export const E2E_AUTH_SECRET = "e2e-only-secret-not-used-in-production-000";

export const E2E_USERS = {
  admin: {
    id: "e2e-admin",
    name: "E2E Admin",
    email: "admin@example.com",
    sessionToken: "e2e-admin-session-token",
  },
  member: {
    id: "e2e-member",
    name: "E2E Member",
    email: "member@example.com",
    sessionToken: "e2e-member-session-token",
  },
} as const;

export const E2E_VIDEO_ID = "dQw4w9WgXcQ";

export const E2E_COURSES = {
  first: {
    id: "e2e-first-course",
    title: "E2E 公開講座1",
    description: "E2E 公開講座1の説明",
    status: "published",
  },
  second: {
    id: "e2e-second-course",
    title: "E2E 公開講座2",
    description: "E2E 公開講座2の説明",
    status: "published",
  },
  draft: {
    id: "e2e-draft-course",
    title: "E2E 下書き講座",
    description: "E2E 下書き講座の説明",
    status: "draft",
  },
} as const;

export const E2E_ENV = {
  TURSO_DATABASE_URL: "file:.test/e2e.db",
  TURSO_AUTH_TOKEN: "",
  BETTER_AUTH_URL: E2E_BASE_URL,
  BETTER_AUTH_SECRET: E2E_AUTH_SECRET,
  GOOGLE_CLIENT_ID: "e2e-google-client-id",
  GOOGLE_CLIENT_SECRET: "e2e-google-client-secret",
  ADMIN_EMAIL: E2E_USERS.admin.email,
};
