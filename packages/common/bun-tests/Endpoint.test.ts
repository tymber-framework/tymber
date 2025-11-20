import { describe, it } from "bun:test";
import assert from "bun:assert";
import { App, Endpoint } from "../src";
import { createTestDB } from "../test/setup";
import { Client } from "@tymber/client";

describe("Endpoint", () => {
  it("should return a JSON object", async () => {
    const db = await createTestDB();
    const app = await App.create(db, [
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
    ]);

    const httpServer = Bun.serve({
      port: 0,
      fetch: app.fetch,
    });

    const client = new Client(`http://localhost:${httpServer.port}`);
    const res = await client.fetch({
      method: "GET",
      path: "/test",
    });

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      hello: "world",
    });
  });
});
