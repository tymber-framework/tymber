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
});
