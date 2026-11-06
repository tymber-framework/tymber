import { describe, it } from "node:test";
import * as assert from "node:assert";
import { createTestApp, Middleware } from "../../src";
import { Client } from "@tymber/client";
import { createTestDB } from "../setup";

describe("Middleware", () => {
  it("should stop the execution", async () => {
    const ctx = await createTestApp(
      () => createTestDB(),
      [
        {
          name: "test",
          version: "0.0.1",
          init(app) {
            app.middleware(
              class extends Middleware {
                handle() {
                  return Response.json({
                    hello: "world",
                  });
                }
              },
            );
          },
        },
      ],
    );

    const client = new Client(ctx.baseUrl);
    const res = await client.fetch({
      method: "GET",
      path: "/test",
    });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      hello: "world",
    });

    return ctx.close();
  });

  it("should catch any exception", async () => {
    const ctx = await createTestApp(
      () => createTestDB(),
      [
        {
          name: "test",
          version: "0.0.1",
          init(app) {
            app.middleware(
              class extends Middleware {
                handle() {
                  throw "error";
                }
              },
            );
          },
        },
      ],
    );

    const client = new Client(ctx.baseUrl);
    const res = await client.fetch({
      method: "GET",
      path: "/test",
    });
    assert.equal(res.status, 500);
    assert.deepEqual(res.body, {
      message: "an unexpected error occurred",
    });

    return ctx.close();
  });

  it("should execute middlewares in the specified order", async () => {
    const executionOrder: string[] = [];

    const ctx = await createTestApp(
      () => createTestDB(),
      [
        {
          name: "test",
          version: "0.0.1",
          init(app) {
            app.middleware(
              class Middleware1 extends Middleware {
                handle() {
                  executionOrder.push("middleware-5");
                }
              },
              5,
            );

            app.middleware(
              class Middleware2 extends Middleware {
                handle() {
                  executionOrder.push("middleware-10");
                }
              },
              10,
            );

            app.middleware(
              class Middleware3 extends Middleware {
                handle() {
                  executionOrder.push("middleware-100");
                }
              },
            ); // default order 100

            app.middleware(
              class Middleware4 extends Middleware {
                handle() {
                  executionOrder.push("middleware-200");
                }
              },
              200,
            );
          },
        },
      ],
    );

    const client = new Client(ctx.baseUrl);
    await client.fetch({
      method: "GET",
      path: "/test",
    });

    assert.deepEqual(executionOrder, [
      "middleware-5",
      "middleware-10",
      "middleware-100",
      "middleware-200",
    ]);

    return ctx.close();
  });

  it("should execute middlewares from different modules in the correct global order", async () => {
    const executionOrder: string[] = [];

    const ctx = await createTestApp(
      () => createTestDB(),
      [
        {
          name: "module-a",
          version: "0.0.1",
          init(app) {
            app.middleware(
              class MiddlewareA1 extends Middleware {
                handle() {
                  executionOrder.push("module-a-200");
                }
              },
              200,
            );

            app.middleware(
              class MiddlewareA2 extends Middleware {
                handle() {
                  executionOrder.push("module-a-50");
                }
              },
              50,
            );
          },
        },
        {
          name: "module-b",
          version: "0.0.1",
          init(app) {
            app.middleware(
              class MiddlewareB1 extends Middleware {
                handle() {
                  executionOrder.push("module-b-10");
                }
              },
              10,
            );

            app.middleware(
              class MiddlewareB2 extends Middleware {
                handle() {
                  executionOrder.push("module-b-150");
                }
              },
              150,
            );
          },
        },
      ],
    );

    const client = new Client(ctx.baseUrl);
    await client.fetch({
      method: "GET",
      path: "/test",
    });

    assert.deepEqual(executionOrder, [
      "module-b-10",
      "module-a-50",
      "module-b-150",
      "module-a-200",
    ]);

    return ctx.close();
  });
});
