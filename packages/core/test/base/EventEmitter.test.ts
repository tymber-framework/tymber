import { describe, it, mock } from "node:test";
import * as assert from "node:assert";
import { EventEmitter } from "../../src/";

describe("EventEmitter", () => {
  it("should emit and receive events", () => {
    interface TestEvent {
      test: string;
    }

    const emitter = new EventEmitter<TestEvent>();
    const handler = mock.fn();
    emitter.on("test", handler);
    emitter.emit("test", "data");
    assert.equal(handler.mock.calls.length, 1);
    assert.deepEqual(handler.mock.calls[0].arguments, ["data"]);
  });
});
