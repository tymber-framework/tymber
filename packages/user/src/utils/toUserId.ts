import type { UserId } from "@tymber/core";

export function toUserId(id: string) {
  const value = Number(id);

  if (!Number.isSafeInteger(value)) {
    throw new Error("invalid user ID");
  }

  return value as unknown as UserId;
}
