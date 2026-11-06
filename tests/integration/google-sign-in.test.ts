import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/auth/[...all]/route";
import { resetTestDatabase } from "./test-database";

describe("Googleログインの開始", () => {
  it("IT-090: Googleへの要求に prompt=select_account が含まれる", async () => {
    await resetTestDatabase();

    const response = await POST(
      new Request("http://localhost:3000/api/auth/sign-in/social", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ provider: "google", callbackURL: "/" }),
      }),
    );

    expect(response.status).toBe(200);
    const { url } = (await response.json()) as { url: string };
    const authorizeUrl = new URL(url);
    expect(authorizeUrl.hostname).toBe("accounts.google.com");
    expect(authorizeUrl.searchParams.get("prompt")).toBe("select_account");
  });
});
