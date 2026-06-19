import { describe, it, before, after } from "node:test";
import * as assert from "node:assert";
import { emptyContext, waitFor } from "@tymber/core";
import { setup, TestContext } from "../setup";
import { EventSource, Agent } from "undici";

// ref: https://github.com/nodejs/undici/blob/main/docs/docs/api/EventSource.md?plain=1
class CustomHeaderAgent extends Agent {
  constructor(private readonly sid: string) {
    super();
  }

  dispatch(opts, handler) {
    opts.headers["cookie"] = `sid=${this.sid}`;
    return super.dispatch(opts, handler);
  }
}

function times(n: number, resolve: () => void, reject: (err: Error) => void) {
  let count = 0;
  return () => {
    count++;
    if (count === n) {
      setTimeout(() => resolve(), 50);
    } else if (count > n) {
      reject(new Error("should not happen"));
    }
  };
}

function shouldNotHappen(reject: (err: Error) => void) {
  return () => reject(new Error("should not happen"));
}

describe("SSEEndpoint", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
  });

  after(() => {
    ctx.close();
  });

  it("should work", async () => {
    const eventSource = new EventSource(ctx.baseUrl + "/api/events", {
      dispatcher: new CustomHeaderAgent(ctx.sessionIds[0]),
    });

    await waitFor(eventSource, "open");

    await new Promise<void>((resolve) => {
      let count = 0;

      // @ts-expect-error data is not defined
      eventSource.addEventListener("event1", ({ data }) => {
        assert.equal(++count, 1);
        assert.equal(data, "");
      });

      // @ts-expect-error data is not defined
      eventSource.addEventListener("event2", ({ data }) => {
        assert.equal(++count, 2);
        assert.equal(data, "2");
      });

      // @ts-expect-error data is not defined
      eventSource.addEventListener("event3", ({ data }) => {
        assert.equal(++count, 3);
        assert.equal(data, '{"3":"4"}');
        resolve();
      });

      ctx.sseService.publish(emptyContext(), "event1");
      ctx.sseService.publish(emptyContext(), "event2", 2);
      ctx.sseService.publish(emptyContext(), "event3", { 3: "4" });
    });

    eventSource.close();
  });

  describe("with filter", () => {
    let eventSources: EventSource[] = [];

    before(async () => {
      for (let i = 0; i < 3; i++) {
        const eventSource = new EventSource(ctx.baseUrl + "/api/events", {
          dispatcher: new CustomHeaderAgent(ctx.sessionIds[i]),
        });

        await waitFor(eventSource, "open");

        eventSources.push(eventSource);
      }
    });

    after(() => {
      for (const eventSource of eventSources) {
        eventSource.close();
      }
    });

    it("should work (user)", async () => {
      return new Promise<void>((resolve, reject) => {
        const onMessage = times(1, resolve, reject);

        eventSources[0].addEventListener("message", onMessage);
        eventSources[1].addEventListener("message", shouldNotHappen(reject));
        eventSources[2].addEventListener("message", shouldNotHappen(reject));

        ctx.sseService
          .toUser(ctx.userIds[0])
          .publish(emptyContext(), "message");
      });
    });

    it("should work (group)", async () => {
      return new Promise<void>((resolve, reject) => {
        const onMessage = times(2, resolve, reject);

        eventSources[0].addEventListener("message", onMessage);
        eventSources[1].addEventListener("message", onMessage);
        eventSources[2].addEventListener("message", shouldNotHappen(reject));

        ctx.sseService
          .toGroup(ctx.groupIds[0])
          .publish(emptyContext(), "message");
      });
    });

    it("should work (group with role)", async () => {
      return new Promise<void>((resolve, reject) => {
        const onMessage = times(1, resolve, reject);

        eventSources[0].addEventListener("message", onMessage);
        eventSources[1].addEventListener("message", shouldNotHappen(reject));
        eventSources[2].addEventListener("message", shouldNotHappen(reject));

        ctx.sseService
          .toGroupWithRole(ctx.groupIds[0], 0)
          .publish(emptyContext(), "message");
      });
    });
  });

  it("should reject anonymous users", async () => {
    return new Promise<void>((resolve, reject) => {
      const eventSource = new EventSource(`${ctx.baseUrl}/api/events`);

      eventSource.addEventListener("open", () => {
        reject(new Error("should not happen"));
      });

      eventSource.addEventListener("error", () => {
        resolve();
      });
    });
  });
});
