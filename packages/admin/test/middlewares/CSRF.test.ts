import { after, before, describe, it } from "node:test";
import * as assert from "node:assert";
import { Client } from "@tymber/client";
import { createTestDB } from "../setup";
import { CSRF } from "../../src/middlewares/CSRF";
import { BaseTestContext, createTestApp, Endpoint } from "@tymber/common";

describe("CSRF", () => {
  let ctx: BaseTestContext;

  before(async () => {
    ctx = await createTestApp(
      () => createTestDB(),
      [
        {
          name: "test",
          version: "0.0.1",
          init(app) {
            app.middleware(CSRF);

            app.endpoint(
              "GET",
              "/test",
              class extends Endpoint {
                allowAnonymous = true;

                override handle() {
                  return Response.json({ status: "OK" });
                }
              },
            );
          },
        },
      ],
    );
  });

  after(() => ctx.close());

  it("should allow request with the CSRF header", async () => {
    const client = new Client(ctx.baseUrl);
    const res = await client.fetch({
      method: "GET",
      path: "/test",
    });
    assert.equal(res.status, 200);
  });

  it("should reject any request without the CSRF header", async () => {
    const res = await fetch(ctx.baseUrl + "/test", {
      headers: {
        origin: "https://good-domain.com",
      },
    });
    assert.equal(res.status, 403);
  });
});
