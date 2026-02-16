import { debuglog } from "node:util";

export function createDebug(module: string) {
  return debuglog(`tymber:${module}`);
}
