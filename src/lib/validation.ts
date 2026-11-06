import { ValidationError } from "./errors";

export function asRecord(input: unknown): Record<string, unknown> {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new ValidationError("リクエストの内容が正しくありません。");
  }
  return input as Record<string, unknown>;
}

export function parseTitle(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError("タイトルを入力してください。");
  }
  return value.trim();
}
