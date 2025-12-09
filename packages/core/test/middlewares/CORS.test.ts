import { after, before, describe, it } from "node:test";
import * as assert from "node:assert";
import { Client } from "@tymber/client";
import { createTestDB } from "../setup";
import { CORS } from "../../src/middlewares/CORS";
import {
  BaseTestContext,
  ConfigService,
  createTestApp,
  Endpoint,
} from "@tymber/common";

describe("CORS", () => {
  let ctx: BaseTestContext;

  before(async () => {
    ctx = await createTestApp(
      () => createTestDB(),
      [
        {
          name: "test",
          version: "0.0.1",
          init(app) {
            app.middleware(CORS);

            app.component(
              class extends ConfigService {
                protected getCurrentValues() {
                  return Promise.resolve({
                    CORS_ALLOW_ORIGINS: ["https://good-domain.com"],
                    CORS_ALLOW_CREDENTIALS: true,
                  });
                }
              },
            );

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

  it("should add the CORS headers to the preflight request", async () => {
    const client = new Client(ctx.baseUrl);
    const res = await client.fetch({
      method: "OPTIONS",
      path: "/test",
      headers: {
        origin: "https://good-domain.com",
      },
    });
    assert.equal(res.status, 204);
    assert.equal(
      res.headers.get("access-control-allow-origin"),
      "https://good-domain.com",
    );
    assert.equal(res.headers.get("access-control-allow-credentials"), "true");
    assert.equal(
      res.headers.get("access-control-allow-methods"),
      "GET,HEAD,PUT,PATCH,POST,DELETE",
    );
  });

  it("should not add the CORS headers to the preflight request (bad domain)", async () => {
    const client = new Client(ctx.baseUrl);
    const res = await client.fetch({
      method: "OPTIONS",
      path: "/test",
      headers: {
        origin: "https://bad-domain.com",
      },
    });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get("access-control-allow-origin"), "false");
    assert.equal(res.headers.get("access-control-allow-credentials"), "true");
  });

  it("should add the CORS headers to the actual request", async () => {
    const client = new Client(ctx.baseUrl);
    const res = await client.fetch({
      method: "GET",
      path: "/test",
      headers: {
        origin: "https://good-domain.com",
      },
    });
    assert.equal(res.status, 200);
    assert.equal(
      res.headers.get("access-control-allow-origin"),
      "https://good-domain.com",
    );
    assert.equal(res.headers.get("access-control-allow-credentials"), "true");
    assert.equal(res.headers.has("access-control-allow-methods"), false);
  });
});
