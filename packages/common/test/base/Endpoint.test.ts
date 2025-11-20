import { describe, it } from "node:test";
import * as assert from "node:assert";
import { createTestApp, Endpoint } from "../../src";
import { Client } from "@tymber/client";
import { createTestDB } from "../setup";

describe("Endpoint", () => {
  it("should return a JSON object", async () => {
    const ctx = await createTestApp(
      () => createTestDB(),
      [
        {
          name: "test",
          init(app) {
            app.endpoint(
              "GET",
              "/test",
              class extends Endpoint {
                override allowAnonymous = true;

                override handle() {
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

  it("should return an empty response", async () => {
    const ctx = await createTestApp(
      () => createTestDB(),
      [
        {
          name: "test",
          init(app) {
            app.endpoint(
              "GET",
              "/test",
              class extends Endpoint {
                override allowAnonymous = true;

                override handle() {
                  return new Response(null, {
                    status: 204,
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
    assert.equal(res.status, 204);

    return ctx.close();
  });

  it("should catch any exception", async () => {
    const ctx = await createTestApp(
      () => createTestDB(),
      [
        {
          name: "test",
          init(app) {
            app.endpoint(
              "GET",
              "/test",
              class extends Endpoint {
                override allowAnonymous = true;

                override handle(): Response {
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

  it("should validate the body", async () => {
    const ctx = await createTestApp(
      () => createTestDB(),
      [
        {
          name: "test",
          init(app) {
            app.endpoint(
              "POST",
              "/test",
              class extends Endpoint {
                override allowAnonymous = true;

                payloadSchema = {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                  },
                  required: ["id"],
                };

                override handle() {
                  return Promise.reject("should not happen");
                }
              },
            );
          },
        },
      ],
    );

    const client = new Client(ctx.baseUrl);
    const res = await client.fetch({
      method: "POST",
      path: "/test",
      payload: {},
    });
    assert.equal(res.status, 400);
    assert.deepEqual(res.body, {
      message: "invalid payload",
      errors: [
        {
          keyword: "required",
          message: "must have required property 'id'",
        },
      ],
    });

    return ctx.close();
  });

  it("should check the permissions", async () => {
    const ctx = await createTestApp(
      () => createTestDB(),
      [
        {
          name: "test",
          init(app) {
            app.endpoint(
              "GET",
              "/test",
              class extends Endpoint {
                override allowAnonymous = true;

                override hasPermission() {
                  return false;
                }

                override handle() {
                  return Promise.reject("should not happen");
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
    assert.equal(res.status, 403);
    assert.deepEqual(res.body, {
      message: "forbidden",
    });

    return ctx.close();
  });
});
