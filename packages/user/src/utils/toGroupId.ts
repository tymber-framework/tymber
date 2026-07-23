import type { GroupId } from "@tymber/core";

export function toGroupId(id: string) {
  const value = Number(id);

  if (!Number.isSafeInteger(value)) {
    throw new Error("invalid group ID");
  }

  return value as unknown as GroupId;
}
