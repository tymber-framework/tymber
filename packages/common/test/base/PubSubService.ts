import { describe, it } from "node:test";
import * as assert from "node:assert";
import { join } from "node:path";
import { fork } from "node:child_process";

describe("NodeClusterPubSubService", () => {
  it("should emit and receive events", () => {
    const primary = fork(join(import.meta.dirname, "fixtures", "cluster.ts"));

    return new Promise<void>((resolve) => {
      primary.on("exit", (code) => {
        assert.equal(code, 0);
        resolve();
      });
    });
  });
});
