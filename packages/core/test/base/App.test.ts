import { describe, it } from "node:test";
import * as assert from "node:assert";
import {
  App,
  type AppInit,
  Component,
  createTestApp,
  Endpoint,
  HttpContext,
  Middleware,
  sleep,
} from "../../src";
import { createTestDB } from "../setup";

describe("App", () => {
  it("should initialize and close components", async () => {
    let initCalled = false;
    let closeCalled = false;

    class TestComponent extends Component {
      override async init() {
        initCalled = true;
      }

      override async close() {
        closeCalled = true;
      }
    }

    const app = await App.create({
      components: [],
      modules: [
        {
          name: "test",
          version: "0.0.1",
          init(app: AppInit) {
            app.component(TestComponent);
          },
        },
      ],
    });

    assert.equal(initCalled, true);
    assert.equal(closeCalled, false);

    await app.close();

    assert.equal(closeCalled, true);
  });

  describe("aborted requests", () => {
    it("should handle a request aborted by the client", async () => {
      let abortSignalTriggered = false;

      const ctx = await createTestApp(
        () => createTestDB(),
        [
          {
            name: "test",
            version: "0.0.1",
            init(app) {
              app.endpoint(
                "GET",
                "/test",
                class extends Endpoint {
                  override async handle(ctx: HttpContext) {
                    ctx.signal.addEventListener("abort", () => {
                      abortSignalTriggered = true;
                    });

                    await sleep(1000);

                    return new Response("ok");
                  }
                },
              );
            },
          },
        ],
      );

      const controller = new AbortController();

      const fetchPromise = fetch(`${ctx.baseUrl}/test`, {
        signal: controller.signal,
      });

      // wait a bit for the request to reach the server
      await sleep(100);

      assert.equal(abortSignalTriggered, false);
      controller.abort();

      try {
        await fetchPromise;
      } catch (e) {
        // ignore abort error
      }

      // wait a bit for the server to process the abort
      await sleep(100);

      assert.equal(abortSignalTriggered, true);

      return ctx.close();
    });

    it("should not send 'abort' for successful requests", async () => {
      let abortSignalTriggered = false;

      const ctx = await createTestApp(
        () => createTestDB(),
        [
          {
            name: "test",
            version: "0.0.1",
            init(app) {
              app.endpoint(
                "GET",
                "/test",
                class extends Endpoint {
                  override async handle(ctx: HttpContext) {
                    ctx.signal.addEventListener("abort", () => {
                      abortSignalTriggered = true;
                    });

                    return new Response("ok");
                  }
                },
              );
            },
          },
        ],
      );

      const res = await fetch(`${ctx.baseUrl}/test`);

      await sleep(20);

      assert.equal(abortSignalTriggered, false);
      assert.equal(res.status, 200);

      return ctx.close();
    });

    it("should stop execution when request is aborted", async () => {
      let middleware1Executed = false;
      let middleware2Executed = false;
      let endpointExecuted = false;

      const ctx = await createTestApp(
        () => createTestDB(),
        [
          {
            name: "test",
            version: "0.0.1",
            init(app) {
              app.middleware(
                class extends Middleware {
                  override async handle(ctx: HttpContext) {
                    middleware1Executed = true;
                    await sleep(100);
                    return;
                  }
                },
              );

              app.middleware(
                class extends Middleware {
                  override async handle(ctx: HttpContext) {
                    middleware2Executed = true;
                    return;
                  }
                },
              );

              app.endpoint(
                "GET",
                "/test",
                class extends Endpoint {
                  override async handle() {
                    endpointExecuted = true;
                    return new Response("ok");
                  }
                },
              );
            },
          },
        ],
      );

      const controller = new AbortController();
      const fetchPromise = fetch(`${ctx.baseUrl}/test`, {
        signal: controller.signal,
      });

      // wait for it to be in the first middleware
      await sleep(20);

      assert.equal(middleware1Executed, true);
      assert.equal(middleware2Executed, false);
      assert.equal(endpointExecuted, false);

      controller.abort();

      try {
        await fetchPromise;
      } catch (e) {
        // ignore
      }

      // wait for potential further execution
      await sleep(200);

      assert.equal(middleware1Executed, true);
      assert.equal(middleware2Executed, false);
      assert.equal(endpointExecuted, false);

      return ctx.close();
    });
  });
});
